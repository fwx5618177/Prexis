/**
 * Prexis - 路由整合
 */

import { Routes } from '@types'
import { UserRoute } from '@/modules/users'
import { AuthRoute } from '@/modules/auth'
import { GraphqlRoute } from '@/modules/graphql'
import HealthRoute from '@/modules/health'
import WebSocketRoute from '@/modules/websocket/routes/websocket.route'

const RouteLists: Record<string, Routes> = {
  health: new HealthRoute(),
  users: new UserRoute(),
  auth: new AuthRoute(),
  graphql: new GraphqlRoute(),
  websocket: new WebSocketRoute(),
}

export default RouteLists
