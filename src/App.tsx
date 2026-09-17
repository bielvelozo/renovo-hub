import { Route, Routes } from 'react-router'
import { Casca } from './casca/Casca'
import { LetraDaMusica } from './culto/LetraDaMusica'
import { LetraDoItem } from './culto/LetraDoItem'
import { ModoCulto } from './culto/ModoCulto'
import { Ordem } from './culto/Ordem'
import { Pesquisar } from './culto/Pesquisar'
import { Adicionar } from './paginas/Adicionar'
import { Admin } from './paginas/Admin'
import { Convites } from './paginas/admin/Convites'
import { EditarFormacao } from './paginas/admin/EditarFormacao'
import { Formacoes } from './paginas/admin/Formacoes'
import { Funcoes } from './paginas/admin/Funcoes'
import { Membros } from './paginas/admin/Membros'
import { MusicasARevisar } from './paginas/admin/MusicasARevisar'
import { Painel } from './paginas/admin/Painel'
import { Sequencias } from './paginas/admin/Sequencias'
import { Entrar } from './paginas/Entrar'
import { Equipe } from './paginas/Equipe'
import { Escala } from './paginas/Escala'
import { Esqueci } from './paginas/Esqueci'
import { Inicio } from './paginas/Inicio'
import { Instalar } from './paginas/Instalar'
import { LetraNaCasca } from './paginas/LetraNaCasca'
import { Medley } from './paginas/Medley'
import { Mes } from './paginas/Mes'
import { Musica } from './paginas/Musica'
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
        <Route path="/culto/:escalaId" element={<ModoCulto />}>
          <Route index element={<Ordem />} />
          <Route path="item/:itemId" element={<LetraDoItem />} />
          <Route path="pesquisar" element={<Pesquisar />} />
          <Route path="musica/:musicaId" element={<LetraDaMusica />} />
        </Route>
        <Route path="/" element={<Casca />}>
          <Route index element={<Inicio />} />
          <Route path="mes" element={<Mes />} />
          <Route path="escalas/:id" element={<Escala />} />
          <Route path="escalas/:id/equipe" element={<Equipe />} />
          <Route path="escalas/:id/adicionar" element={<Adicionar />} />
          <Route path="escalas/:id/medley" element={<Medley />} />
          <Route path="musicas" element={<Musicas />} />
          <Route path="musicas/:id" element={<Musica />} />
          <Route path="musicas/:id/letra" element={<LetraNaCasca />} />
          <Route path="sugestoes" element={<Sugestoes />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="admin" element={<Admin />}>
            <Route index element={<Painel />} />
            <Route path="membros" element={<Membros />} />
            <Route path="convites" element={<Convites />} />
            <Route path="funcoes" element={<Funcoes />} />
            <Route path="formacoes" element={<Formacoes />} />
            <Route path="formacoes/:id" element={<EditarFormacao />} />
            <Route path="musicas" element={<MusicasARevisar />} />
            <Route path="sequencias" element={<Sequencias />} />
          </Route>
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Routes>
    </ProvedorDeTema>
  )
}
