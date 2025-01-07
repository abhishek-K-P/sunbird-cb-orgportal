import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { MyDashboardHomeComponent } from './components/my-dashboard-home/my-dashboard-home.component'

const routes: Routes = []

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: MyDashboardHomeComponent,
        children: routes,
        data: { module: 'Dashboard' },
      },
      {
        path: 'temp',
        component: MyDashboardHomeComponent,
        children: routes,
        data: { module: 'Dashboard' },
      },
    ]),
  ],
  exports: [RouterModule],
})
export class MyDashboardRoutingModule { }
