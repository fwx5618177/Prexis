import { CreatePostBlog, Post, UpdatePostBlog } from '../dtos/graphql.dto'
import { HttpException } from '@/exceptions/HttpException'
import { isEmpty } from '@/utils/util'
import prisma from '@/prisma/client'

class GraphqlService {
  public blog = prisma.blog

  public async getPostById(postId: string): Promise<Post> {
    if (!postId) throw new HttpException(400, 'Not blog:' + postId)

    const listPosts: Post = (await this.blog.findFirst({
      where: {
        id: postId,
      },
    })) as Post

    if (!listPosts) throw new HttpException(409, `${postId} not found`)

    return listPosts
  }

  public async createPost(post: CreatePostBlog): Promise<Post> {
    if (isEmpty(post)) throw new HttpException(400, "That's not blog data:" + post.id)

    const findBlog: Post = (await this.blog.findUnique({
      where: {
        id: post.id,
      },
    })) as Post

    if (findBlog) throw new HttpException(409, `Id ${post.id} already exists`)

    const createData: Post = await this.blog.create({
      data: {
        ...post,
      },
    })

    return createData
  }

  public async updatePost(post: UpdatePostBlog): Promise<Post> {
    if (isEmpty(post)) throw new HttpException(400, "That's not blog data:" + post.id)
    const findBlog: Post = (await this.blog.findUnique({
      where: {
        id: post.id,
      },
    })) as Post

    if (!findBlog) throw new HttpException(409, 'Not Blog:' + post.id)

    const updatePost: Post = await this.blog.update({
      where: {
        id: post.id,
      },
      data: {
        ...post,
      },
    })

    return updatePost
  }

  public async deletePost(postId: string): Promise<Post> {
    if (!postId) throw new HttpException(400, 'Not blog:' + postId)

    const findBlog: Post = (await this.blog.findUniqueOrThrow({
      where: {
        id: postId,
      },
    })) as Post

    if (!findBlog) throw new HttpException(409, 'Not blog:' + postId)

    const deletePost: Post = await this.blog.delete({
      where: {
        id: postId,
      },
    })

    return deletePost
  }

  public async listPosts(): Promise<Post[]> {
    const findBlog: Post[] = (await this.blog.findMany({})) as Post[]

    if (!findBlog) throw new HttpException(409, 'No data')

    return findBlog
  }
}

export default GraphqlService
