export interface Post {
  id: string
  title: string
  content: string
}

export interface CreatePostBlog {
  id: string
  title: string
  content: string
}

export interface UpdatePostBlog {
  id: string
  title: string
  content: string
}

export interface MutationsBlog {
  createPost: (post: CreatePostBlog) => Post
  deletePost: (postId: string) => Post
  updatePost: (post: UpdatePostBlog) => Post
}
