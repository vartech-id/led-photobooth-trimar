import { createRouter, createWebHistory } from 'vue-router'
import WelcomeScreen from '../views/WelcomeScreen.vue'
import WaitingPhoto from '../views/WaitingPhoto.vue'
import Result from '../views/Result.vue'
import Display1 from '../views/Display1.vue'
import Display2 from '../views/Display2.vue'
import Display3 from '../views/Display3.vue'


const routes = [
  { path: '/', name: 'WelcomeScreen', component: WelcomeScreen },
  { path: '/waiting-photo', name: 'WaitingPhoto', component: WaitingPhoto },
  { path: '/result', name: 'Result', component: Result },
  { path: '/display1', name: 'Display1', component: Display1 },
  { path: '/display2', name: 'Display2', component: Display2 },   
  { path: '/display3', name: 'Display3', component: Display3 },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
