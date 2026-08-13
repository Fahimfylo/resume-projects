"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/ui/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Heart, MessageCircle, Send, Image as ImageIcon, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useApi } from "@/lib/useApi"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Comment {
  _id: string
  userId: { _id: string; gamerTag: string; avatarUrl: string }
  content: string
  createdAt: string
}

interface Post {
  _id: string
  userId: { _id: string; gamerTag: string; avatarUrl: string; rank: string }
  content: string
  image?: string
  likes: string[]
  likeCount: number
  comments: Comment[]
  commentCount: number
  createdAt: string
}

export default function SocialPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
  }, [user, authLoading, router])
  const [newPost, setNewPost] = useState("")
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  const { data: postsData, loading, refetch } = useApi(
    () => api.get<{ success: boolean; posts: Post[]; pagination: any }>('/posts?limit=20'),
    []
  )

  const posts = postsData?.posts || []

  const handlePost = async () => {
    if (!newPost.trim()) return
    try {
      await api.post('/posts', { content: newPost })
      setNewPost("")
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find((p) => p._id === postId)
      if (!post) return
      if (post.likes.includes(user?._id || '')) {
        await api.post(`/posts/${postId}/unlike`)
      } else {
        await api.post(`/posts/${postId}/like`)
      }
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]
    if (!content?.trim()) return
    try {
      await api.post(`/posts/${postId}/comments`, { content })
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  if (authLoading) return <div className="min-h-screen bg-nexus-void flex items-center justify-center text-nexus-jade font-headline">SYNCING...</div>

  return (
    <main className="min-h-screen bg-nexus-void pb-24">
      <Navigation />

      <div className="container px-6 pt-32 max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-headline font-black text-white uppercase tracking-tighter">
            NEURAL <span className="text-nexus-jade">FEED</span>
          </h1>
          <p className="text-white/40 font-ui text-sm mt-2 uppercase tracking-widest">Global activity from the NEXUS multiverse</p>
        </div>

        {/* Create Post */}
        <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame mb-12 bg-nexus-carbon/40">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12 border border-nexus-jade/30">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="bg-nexus-carbon text-nexus-jade">{user?.gamerTag?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-white font-ui resize-none min-h-[80px]"
                placeholder="Broadcast your achievements..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-4">
                  <Button variant="ghost" size="icon" className="text-white/40 hover:text-nexus-jade">
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                </div>
                <Button
                  onClick={handlePost}
                  disabled={!newPost.trim()}
                  className="bg-nexus-jade text-nexus-void font-headline rounded-none px-8"
                >
                  BROADCAST
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Feed */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-nexus-jade font-headline animate-pulse">LOADING FEED...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {posts.map((post, idx) => {
                const isLiked = post.likes.includes(user?._id || '')
                return (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-panel border-white/10 p-6 rounded-none bg-nexus-carbon/20 hover:bg-nexus-carbon/40 transition-colors">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full border-2 border-nexus-jade/20 p-0.5">
                            <img
                              src={post.userId?.avatarUrl || `https://picsum.photos/seed/${post.userId?._id}/100/100`}
                              className="w-full h-full rounded-full object-cover"
                              alt=""
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-headline text-sm font-bold text-white uppercase tracking-tighter">
                                {post.userId?.gamerTag || 'UNKNOWN'}
                              </h4>
                              <span className="text-[8px] px-2 py-0.5 bg-nexus-jade/10 text-nexus-jade rounded font-headline">
                                {post.userId?.rank || 'NOVICE'}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 font-ui uppercase">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white/20">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="font-ui text-white/80 leading-relaxed mb-6">
                        {post.content}
                      </div>

                      {post.image && (
                        <div className="mb-6 rounded-lg overflow-hidden border border-white/5">
                          <img src={post.image} className="w-full h-auto" alt="" />
                        </div>
                      )}

                      <div className="flex items-center gap-8 border-t border-white/5 pt-6">
                        <button
                          onClick={() => handleLike(post._id)}
                          className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-nexus-jade' : 'text-white/40 hover:text-nexus-jade'}`}
                        >
                          <Heart className={`w-5 h-5 ${isLiked ? 'fill-nexus-jade' : ''}`} />
                          <span className="text-xs font-headline">{post.likes.length}</span>
                        </button>
                        <button className="flex items-center gap-2 text-white/40 hover:text-nexus-teal transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-xs font-headline">{post.comments.length}</span>
                        </button>
                      </div>

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                          {post.comments.slice(0, 3).map((comment) => (
                            <div key={comment._id} className="flex gap-3">
                              <Avatar className="w-8 h-8 border border-white/5">
                                <AvatarImage src={comment.userId?.avatarUrl || ''} />
                                <AvatarFallback className="text-[10px]">{comment.userId?.gamerTag?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-headline text-white uppercase">{comment.userId?.gamerTag}</p>
                                <p className="text-xs text-white/60 font-ui">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="mt-4 flex gap-2">
                        <Input
                          placeholder="Add neural comment..."
                          value={commentInputs[post._id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                          }
                          className="bg-white/5 border-white/10 text-white font-ui text-xs h-9"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleComment(post._id)}
                          disabled={!commentInputs[post._id]?.trim()}
                          className="bg-nexus-teal text-nexus-void h-9 w-9"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </main>
  )
}
