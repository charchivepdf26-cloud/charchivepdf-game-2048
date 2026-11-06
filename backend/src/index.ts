import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  GAME_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// Lấy danh sách bảng xếp hạng điểm số
app.get('/api/scores', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM scores ORDER BY score DESC LIMIT 20'
  ).all()
  return c.json(results)
})

// Lưu điểm số mới khi kết thúc game
app.post('/api/scores', async (c) => {
  const { player_name, score } = await c.req.json()
  if (!player_name || score === undefined) {
    return c.json({ error: 'Thiếu thông tin' }, 400)
  }
  
  await c.env.DB.prepare(
    'INSERT INTO scores (player_name, score) VALUES (?, ?)'
  ).bind(player_name, score).run()
  
  return c.json({ success: true })
})

// Xóa điểm số (Dành cho Admin)
app.delete('/api/scores/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM scores WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

export default app