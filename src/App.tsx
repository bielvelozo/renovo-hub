import { Route, Routes } from 'react-router'
import { Casca } from './casca/Casca'
import { Admin } from './paginas/Admin'
import { Entrar } from './paginas/Entrar'
import { Esqueci } from './paginas/Esqueci'
import { Inicio } from './paginas/Inicio'
import { Instalar } from './paginas/Instalar'
import { Mes } from './paginas/Mes'
import { Musicas } from './paginas/Musicas'
import { NaoEncontrada } from './paginas/NaoEncontrada'
import { Perfil } from './paginas/Perfil'
import { Sugestoes } from './paginas/Sugestoes'
import { ProvedorDeTema } from './tema/ProvedorDeTema'

export function App() {
  return (
    <ProvedorDeTema>
      <Routes>
        <Route path="/entrar/:token" element={<Entrar />} />
        <Route path="/esqueci" element={<Esqueci />} />
        <Route path="/instalar" element={<Instalar />} />
        <Route path="/" element={<Casca />}>
          <Route index element={<Inicio />} />
          <Route path="mes" element={<Mes />} />
          <Route path="musicas" element={<Musicas />} />
          <Route path="sugestoes" element={<Sugestoes />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Routes>
    </ProvedorDeTema>
  )
}
