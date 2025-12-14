/**
 * mock data
 */

export const mock_listPosts = () => [
  {
    id: '1',
    title: '1',
    content: '1',
  },
  {
    id: '2',
    title: '2',
    content: '2',
  },
]

export const mock_getPostById = () => ({
  id: '3',
  title: '3',
  content: '3',
})

export const mock_createPost = () => ({
  id: '4',
  title: '4',
  content: '4',
})

export const mock_deletePost = () => ({
  id: '5',
  title: '5',
  content: '5',
})

export const mock_updatePost = () => ({
  id: '6',
  title: '6',
  content: '6',
})

export const mock_source_getPostById = `query {
  getPostById(postId: "3") {
      id,
      title,
      content
  }
}`

export const mock_source_createPost = `mutation {
  createPost (post: { id: "4", title: "4", content: "4" }) { id, title, content }
}`
