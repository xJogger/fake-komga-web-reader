import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Setup from './pages/Setup';
import Libraries from './pages/Libraries';
import SeriesList from './pages/SeriesList';
import BookList from './pages/BookList';
import Reader from './pages/Reader';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Full screen reader without bottom nav */}
        <Route path="/reader/:bookId" element={<Reader />} />
        {/* Layout with bottom nav */}
        <Route element={<Layout />}>
          <Route path="/setup" element={<Setup />} />
          <Route path="/libraries" element={<Libraries />} />
          <Route path="/libraries/:libraryId" element={<SeriesList />} />
          <Route path="/series/:seriesId" element={<BookList />} />
          <Route path="*" element={<Navigate to="/libraries" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
