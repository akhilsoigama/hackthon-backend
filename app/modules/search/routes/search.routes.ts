// app/modules/search/routes/search.routes.ts
import router from '@adonisjs/core/services/router'

const SearchController = () => import('../controllers/search_controller.js')

export default function registerSearchRoutes() {
  router.get('/search', [SearchController, 'index'])
}
