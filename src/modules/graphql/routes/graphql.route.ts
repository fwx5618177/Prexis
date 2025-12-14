import { Router } from 'express'
import { Routes } from '@types'
import GraphqlController from '../controllers/graphql.controller'

class GraphqlRoute implements Routes {
  public path = '/graphql'
  public router: Router = Router()
  public graphqlController: GraphqlController = new GraphqlController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.graphqlController.graphqlProcess)
    this.router.post(`${this.path}/mock`, this.graphqlController.graphqlProcessMock)
  }
}

export default GraphqlRoute
