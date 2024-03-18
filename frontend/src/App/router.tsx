import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Layout from './Layout';
import Result from './pages/Result';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'result',
        element: <Result />,
      },
    ],
  },
]);

export default router;