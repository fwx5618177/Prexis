import { CreatePostBlog, Post } from '../dtos/graphql.dto'
import {
  mock_createPost,
  mock_deletePost,
  mock_getPostById,
  mock_listPosts,
  mock_updatePost,
} from '../mocks/graphql.mocks'
import GraphqlService from '../services/graphql.service'
import { loadGraphqlFileSync } from '@/utils/util'
import { logger } from '@/utils/loggers'
import { isDev } from '@/shared/utils'
import { NextFunction, Request, Response } from 'express'
import { graphql, buildSchema } from 'graphql'
import path from 'path'

class GraphqlController {
  private graphqlService: GraphqlService = new GraphqlService()
  private schemaPath = path.join(process.cwd(), 'src/modules/graphql/schemas/schema.graphql')

  /**
   * GraphQL 查询处理器
   * @description 连接数据库并查询数据
   */
  public graphqlProcess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const source = req.body.query as string

      if (isDev()) {
        logger.debug(`GraphQL Query: ${source}`)
      }

      const graphqlSchema = loadGraphqlFileSync(this.schemaPath)
      const schema = buildSchema(graphqlSchema)

      // resolver
      const root = {
        listPosts: async (): Promise<Post[]> => await this.graphqlService.listPosts(),
        getPostById: async (args: { postId: string }): Promise<Post> =>
          await this.graphqlService.getPostById(args.postId),
        createPost: async (args: { post: CreatePostBlog }): Promise<Post> =>
          await this.graphqlService.createPost(args.post),
        deletePost: async (args: { postId: string }): Promise<Post> =>
          await this.graphqlService.deletePost(args.postId),
        updatePost: async (args: { post: CreatePostBlog }): Promise<Post> =>
          await this.graphqlService.updatePost(args.post),
      }

      const result = await graphql({ schema, source, rootValue: root })

      res.header({ 'Content-Type': 'application/json' }).status(200).send(result)
    } catch (err) {
      logger.error('GraphQL process error:', err)
      next(err)
    }
  }

  /**
   * GraphQL Mock 查询处理器
   * @description 返回 mock 数据
   */
  public graphqlProcessMock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const source = req.body.query as string

      const graphqlSchema = loadGraphqlFileSync(this.schemaPath)
      const schema = buildSchema(graphqlSchema)

      // resolver
      const root = {
        listPosts: mock_listPosts,
        getPostById: mock_getPostById,
        createPost: mock_createPost,
        deletePost: mock_deletePost,
        updatePost: mock_updatePost,
      }

      const result = await graphql({ schema, source, rootValue: root })

      res.header({ 'Content-Type': 'application/json' }).status(200).send(result)
    } catch (err) {
      logger.error('GraphQL mock process error:', err)
      next(err)
    }
  }
}

export default GraphqlController
