import { useState, useEffect, useRef } from 'react';
import { getNotes, createNote, updateNote, deleteNote, getCategories, getNotesByCategory, createCategory, deleteCategory } from './api/notes';
import StudyModal from './StudyModal';
import AlbumStudyModal from './AlbumStudyModal';
import Login from './Login';

function App() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [studyNote, setStudyNote] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [studyingAlbum, setStudyingAlbum] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const skipAutosave = useRef(true);

  // ---- Mobile responsive state ----
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobilePane, setMobilePane] = useState('albums'); // 'albums' | 'notes' | 'detail'
  const [editingAlbums, setEditingAlbums] = useState(false); // "Edit" mode toggle for album list

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setIsLoggedIn(false);
  };

  const loadCategories = async () => {
    const res = await getCategories();
    setCategories(res.data);
  };

  const loadNotes = async (cat) => {
    const res = cat ? await getNotesByCategory(cat) : await getNotes();
    setNotes(res.data);
  };

  const startEdit = (note) => {
    skipAutosave.current = true;
    setEditingNote(note._id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditTitle('');
    setEditContent('');
  };

  const selectCategory = (catId) => {
    setActiveCategory(catId);
    if (isMobile) setMobilePane('notes');
  };

  const openNote = (note) => {
    setSelectedNoteId(note._id);
    startEdit(note);
    if (isMobile) setMobilePane('detail');
  };

  const startNewNote = () => {
    setAddingNote(!addingNote);
    if (isMobile) setMobilePane('detail');
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadCategories();
      loadNotes(activeCategory);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      loadNotes(activeCategory);
      setAddingNote(false);
      setSelectedNoteId(null);
      setEditingNote(null);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!editingNote) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      await updateNote(editingNote, { title: editTitle, content: editContent });
      loadCategories();
      loadNotes(activeCategory);
    }, 800);
    return () => clearTimeout(timer);
  }, [editTitle, editContent]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = activeCategory
        ? await getNotesByCategory(activeCategory)
        : await getNotes();
      const q = searchQuery.toLowerCase();
      setSearchResults(
        res.data.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content || !activeCategory) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', activeCategory);
    selectedFiles.forEach(file => formData.append('images', file));

    const res = await createNote(formData);
    setTitle('');
    setContent('');
    setSelectedFiles([]);
    setAddingNote(false);
    loadCategories();
    await loadNotes(activeCategory);
    if (res && res.data && res.data._id) {
      setSelectedNoteId(res.data._id);
    }
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    if (selectedNoteId === id) setSelectedNoteId(null);
    loadCategories();
    loadNotes(activeCategory);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      setAddingCategory(false);
      await loadCategories();
      setActiveCategory(res.data.name);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete album "${name}"? Notes inside will move to Uncategorized.`)) return;
    await deleteCategory(name);
    if (activeCategory === name) setActiveCategory(null);
    loadCategories();
    loadNotes(activeCategory === name ? null : activeCategory);
  };

  const pageStyle = {
    display: 'flex',
    height: '100dvh',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    background: '#fff',
    color: '#000'
  };

  const columnBase = {
    height: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto'
  };

  const albumColStyle = {
    ...columnBase,
    width: isMobile ? '100%' : 170,
    flexShrink: 0,
    borderRight: 'none',
    padding: 0,
    background: '#1c1c1e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column'
  };

  const listColStyle = {
    ...columnBase,
    width: isMobile ? '100%' : 300,
    flexShrink: 0,
    borderRight: isMobile ? 'none' : '1px solid #ddd',
    padding: 20,
    background: '#f7f7f7',
    color: '#000'
  };

  const detailColStyle = {
    ...columnBase,
    flex: isMobile ? 'none' : 1,
    width: isMobile ? '100%' : 'auto',
    padding: isMobile ? 20 : 30,
    background: '#fff',
    color: '#000'
  };

  const backBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#151df5',
    fontSize: 15,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 14
  };

  const albumRowStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #2c2c2e',
    cursor: 'pointer',
    color: '#fff'
  };

  const albumDeleteBtnStyle = {
    width: 22,
    height: 22,
    minWidth: 22,
    borderRadius: 11,
    background: '#ff3b30',
    color: '#fff',
    border: 'none',
    fontSize: 16,
    lineHeight: '20px',
    textAlign: 'center',
    marginRight: 12,
    cursor: 'pointer',
    padding: 0
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const isSearching = searchQuery.trim().length > 0;
  const displayedNotes = isSearching ? searchResults : notes;
  const selectedNote = displayedNotes.find((n) => n._id === selectedNoteId) || null;

  const formatNoteDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  // Always show the clock time in the note list row; the group header
  // ("Today" / "Yesterday" / date) already tells you which day it is.
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  const getPreview = (text) => {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    return clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
  };

  const getDateGroup = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.floor((startOfDay(now) - startOfDay(d)) / (1000 * 60 * 60 * 24));
    if (dayDiff === 0) return 'Today';
    if (dayDiff === 1) return 'Yesterday';
    if (dayDiff <= 7) return 'Previous 7 Days';
    if (dayDiff <= 30) return 'Previous 30 Days';
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  };

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days'];
  const groupedNotes = {};
  displayedNotes.forEach((note) => {
    const group = getDateGroup(note.createdAt);
    if (!groupedNotes[group]) groupedNotes[group] = [];
    groupedNotes[group].push(note);
  });
  const orderedGroupNames = [
    ...groupOrder.filter((g) => groupedNotes[g]),
    ...Object.keys(groupedNotes).filter((g) => !groupOrder.includes(g))
  ];

  const showAlbums = !isMobile || mobilePane === 'albums';
  const showList = !isMobile || mobilePane === 'notes';
  const showDetail = !isMobile || mobilePane === 'detail';

  return (
    <div style={pageStyle}>
      {/* COLUMN 1: ALBUMS */}
      {showAlbums && (
        <div style={albumColStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid #2c2c2e' }}>
            <div style={{ width: 50 }} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#fff' }}>Shiro Notes</h2>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <button onClick={() => setAddingCategory(!addingCategory)} style={{ background: 'none', border: 'none', color: '#f5c518', fontSize: 20, cursor: 'pointer', padding: 0 }}>＋</button>
              <button onClick={() => setEditingAlbums(!editingAlbums)} style={{ background: 'none', border: 'none', color: '#f5c518', fontSize: 15, cursor: 'pointer', padding: 0 }}>{editingAlbums ? 'Done' : 'Edit'}</button>
            </div>
          </div>

          {addingCategory && (
            <form onSubmit={handleAddCategory} style={{ marginBottom: 15, padding: '15px 16px 0' }}>
              <input type="text" placeholder="New album name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus style={{ width: '100%', padding: 6, marginBottom: 5, boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%' }}>Create</button>
            </form>
          )}

          <div onClick={() => selectCategory(null)} style={albumRowStyle}>
            <span style={{ fontSize: 20, marginRight: 12 }}>🗒️</span>
            <span style={{ flex: 1 }}>All Notes</span>
            <span style={{ color: '#8e8e93', fontSize: 17 }}>›</span>
          </div>

          {categories.map((c) => (
            <div key={c._id} onClick={() => selectCategory(c._id)} style={albumRowStyle}>
              {editingAlbums && (
                <button onClick={(e) => handleDeleteCategory(c._id, e)} style={albumDeleteBtnStyle}>−</button>
              )}
              <span style={{ fontSize: 20, marginRight: 12 }}>📁</span>
              <span style={{ flex: 1 }}>{c._id}</span>
              <span style={{ color: '#8e8e93', marginRight: 6 }}>{c.count}</span>
              {!editingAlbums && <span style={{ color: '#8e8e93', fontSize: 17 }}>›</span>}
            </div>
          ))}

          <div style={{ padding: 16, marginTop: 'auto' }}>
            <button onClick={handleLogout} style={{ width: '100%', fontSize: 13, padding: '4px 6px', background: '#444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Log Out</button>
          </div>
        </div>
      )}

      {/* COLUMN 2: NOTE LIST */}
      {showList && (
        <div style={listColStyle}>
          {isMobile && (
            <button onClick={() => setMobilePane('albums')} style={backBtnStyle}>‹ Albums</button>
          )}
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 2px 0', fontSize: 20, color: '#000' }}>
              {isSearching ? `Results for "${searchQuery}"` : (activeCategory ? activeCategory : 'All Notes')}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{displayedNotes.length} note{displayedNotes.length !== 1 ? 's' : ''}</p>
          </div>
          <input type="text" placeholder="Search all notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12, borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }} />
          {activeCategory && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={startNewNote} style={{ fontSize: 13, padding: '4px 8px', background: '#129542', color: '#f7f4f4', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ New Note</button>
              {notes.length > 0 && (
                <button onClick={() => setStudyingAlbum(true)} style={{ fontSize: 13, padding: '4px 8px', background: '#151df5', color: '#f7f4f4', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Study All</button>
              )}
            </div>
          )}
          {!activeCategory && !isSearching && (
            <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>Select an album, or view all notes here.</p>
          )}
          {displayedNotes.length === 0 && (
            <p style={{ color: '#888', fontSize: 13 }}>{isSearching ? 'No notes match your search.' : 'No notes here yet.'}</p>
          )}
          {orderedGroupNames.map((groupName) => (
            <div key={groupName}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, margin: '14px 0 6px' }}>{groupName}</div>
              {groupedNotes[groupName].map((note) => (
                <div key={note._id} onClick={() => openNote(note)} style={{ padding: '10px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, background: selectedNoteId === note._id ? '#e6e6e6' : '#fff', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{note.title}</div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); setStudyNote(note); }} title="Study" style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>📖</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(note._id); }} title="Delete" style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatTime(note.createdAt)}{'  '}{getPreview(note.content)}</div>
                  {!activeCategory && (<div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>📁 {note.category}</div>)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* COLUMN 3: NOTE DETAIL */}
      {showDetail && (
        <div style={detailColStyle}>
          {isMobile && (
            <button onClick={() => setMobilePane('notes')} style={backBtnStyle}>‹ Notes</button>
          )}
          {addingNote && activeCategory && (
            <form onSubmit={handleCreate} style={{ marginBottom: 30 }}>
              <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8, boxSizing: 'border-box' }} />
              <textarea placeholder="Write your note..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8, boxSizing: 'border-box' }} />
              <label htmlFor="photo-upload" style={{ display: 'inline-block', width: 120, textAlign: 'center', padding: '4px 10px', fontSize: 14, background: '#444', color: '#fff', borderRadius: 6, cursor: 'pointer', marginBottom: 10, marginRight: 20 }}>Uploads Photo</label>
              <input id="photo-upload" type="file" accept="image/*" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
              {selectedFiles.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedFiles.map((file, i) => (<img key={i} src={URL.createObjectURL(file)} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />))}
                  </div>
                </div>
              )}
              <button type="submit" style={{ width: 120, textAlign: 'center', fontSize: 14, padding: '4px 10px', background: '#129542', color: '#f7f4f4', border: 'none', borderRadius: 6 }}>Add Note</button>
            </form>
          )}
          {!addingNote && selectedNote && (
            <div>
              {editingNote === selectedNote._id ? (
                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#888' }}>{formatNoteDate(selectedNote.createdAt)}</p>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, boxSizing: 'border-box', background: '#fff', color: '#000', border: 'none', outline: 'none', fontSize: 22, fontWeight: 'bold' }} />
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, boxSizing: 'border-box', minHeight: 300, resize: 'vertical', background: '#fff', color: '#000', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit' }} />
                  {selectedNote.images && selectedNote.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {selectedNote.images.map((img, i) => (<img key={i} src={img} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }} />))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#888' }}>{formatNoteDate(selectedNote.createdAt)}</p>
                  <h2 style={{ margin: '0 0 16px 0', color: '#000' }}>{selectedNote.title}</h2>
                  <p style={{ margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>{selectedNote.content}</p>
                  {selectedNote.images && selectedNote.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      {selectedNote.images.map((img, i) => (<img key={i} src={img} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }} />))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {!addingNote && !selectedNote && (<p style={{ color: '#888' }}>Select a note to view it.</p>)}
        </div>
      )}

      {studyNote && (
        <StudyModal note={studyNote} onClose={() => setStudyNote(null)} onUpdate={(updated) => { setStudyNote(updated); loadCategories(); loadNotes(activeCategory); }} />
      )}
      {studyingAlbum && (
        <AlbumStudyModal categoryName={activeCategory} notes={notes} onClose={() => setStudyingAlbum(false)} />
      )}
    </div>
  );
}

export default App;