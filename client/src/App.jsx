import { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote, getCategories, getNotesByCategory, createCategory, deleteCategory } from './api/notes';
import StudyModal from './StudyModal';
import AlbumStudyModal from './AlbumStudyModal';

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
  const [expandedNotes, setExpandedNotes] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);

  const toggleExpand = (id) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
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
  setEditingNote(note._id);
  setEditTitle(note.title);
  setEditContent(note.content);
};

const cancelEdit = () => {
  setEditingNote(null);
  setEditTitle('');
  setEditContent('');
};

const handleUpdate = async (id) => {
  await updateNote(id, { title: editTitle, content: editContent });
  cancelEdit();
  loadCategories();
  loadNotes(activeCategory);
};

  useEffect(() => {
    loadCategories();
    loadNotes(activeCategory);
  }, []);

  useEffect(() => {
    loadNotes(activeCategory);
    setAddingNote(false);
  }, [activeCategory]);

const handleCreate = async (e) => {
  e.preventDefault();
  if (!title || !content || !activeCategory) return;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('category', activeCategory);
  selectedFiles.forEach(file => formData.append('images', file));

  await createNote(formData);
  setTitle('');
  setContent('');
  setSelectedFiles([]);
  setAddingNote(false);
  loadCategories();
  loadNotes(activeCategory);
};

  const handleDelete = async (id) => {
    await deleteNote(id);
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
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    background: '#fff',
    color: '#000'
  };
  const sidebarStyle = {
    width: 150,
    borderRight: '1px solid #333',
    padding: 20,
    flexShrink: 0,
    background: '#f5c518',
    color: '#000'
  };
  const albumItemStyle = (active) => ({
    padding: '10px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 6,
    background: active ? '#f3eeee' : 'transparent',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  });
  const mainStyle = {
    flex: 1,
    padding: 30,
    maxWidth: 700,
    background: '#fff',
    color: '#000'
  };
  const roundBtnStyle = {
    cursor: 'pointer',
    fontWeight: 'bold',
    width: 28,
    height: 28,
    borderRadius: 6
  };

  return (
    <div style={pageStyle}>
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h2 style={{ fontSize: 18, margin: 0, color: '#000' }}>Shiro Notes</h2>
          <button onClick={() => setAddingCategory(!addingCategory)} style={{ fontSize: 15, padding: '2px 6px', background: '#129542', color: '#f7f4f4', border: 'none', borderRadius: 4 }} >+</button>
        </div>

        {addingCategory && (
          <form onSubmit={handleAddCategory} style={{ marginBottom: 15 }}>
            <input
              type="text"
              placeholder="New album name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: 6, marginBottom: 5 }}
            />
            <button type="submit" style={{ width: '100%' }}>Create</button>
          </form>
        )}

        <div style={albumItemStyle(activeCategory === null)} onClick={() => setActiveCategory(null)}>
          <span>All Notes</span>
        </div>

        {categories.map((c) => (
          <div key={c._id} style={albumItemStyle(activeCategory === c._id)} onClick={() => setActiveCategory(c._id)}>
            <span>{c._id}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888' }}>{c.count}</span>
              <button onClick={(e) => handleDeleteCategory(c._id, e)} style={{ fontSize: 12, padding: '2px 6px', background: '#f40c0c', color: '#f7f4f4', border: 'none', borderRadius: 4 }}>
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={mainStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ margin: 0, color: '#000' }}>{activeCategory ? activeCategory : 'All Notes'}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {activeCategory && notes.length > 0 && (
              <button onClick={() => setStudyingAlbum(true)} style={{ fontSize: 15, padding: '2px 6px', background: '#151df5', color: '#f7f4f4', border: 'none', borderRadius: 4 }}>Study All</button>
            )}
            {activeCategory && (
              <button onClick={() => setAddingNote(!addingNote)} style={{ fontSize: 15, padding: '2px 6px', background: '#129542', color: '#f7f4f4', border: 'none', borderRadius: 4 }}>+</button>
           )}
        </div>
      </div>

        {addingNote && activeCategory && (
          <form onSubmit={handleCreate} style={{ marginBottom: 30 }}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
            />
            <textarea
              placeholder="Write your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
            />
            
            <label
              htmlFor="photo-upload"
              style={{
              display: 'inline-block',
              width: 120,
              textAlign: 'center',
              padding: '4px 10px',
              fontSize: 14,
              background: '#444',
              color: '#fff',
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 10,
              marginRight: 20
            }}
            >
            Uploads Photo
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              style={{ display: 'none' }}
            />
            {selectedFiles.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedFiles.map((file, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(file)}
                      alt=""
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ))}
              </div>
            </div>
          )}
            <button 
            type="submit" 
            style={{ 
              width: 120,
              textAlign: 'center',
              fontSize: 14, 
              padding: '4px 10px', 
              background: '#129542', 
              color: '#f7f4f4', 
              border: 'none', 
              borderRadius: 6 }} 
              >Add Note
              </button>
          </form>
        )}

        {!activeCategory && (
          <p style={{ color: '#888', marginBottom: 20 }}>
            Select an album on the left to add a note into it.
          </p>
        )}

        {notes.length === 0 && <p style={{ color: '#888' }}>No notes here yet.</p>}

        {notes.map((note) => (
          <div key={note._id} style={{ border: '1px solid #444', padding: 15, marginBottom: 10, borderRadius: 6, textAlign: 'left' }}>
            {editingNote === note._id ? (
              <div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, boxSizing: 'border-box' }}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, boxSizing: 'border-box', minHeight: 500, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={() => handleUpdate(note._id)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>{note.title}</h3>
                <p style={{
                  margin: '0 0 8px 0',
                  whiteSpace: 'pre-wrap',
                  maxHeight: expandedNotes[note._id] ? 'none' : 20,
                  overflow: 'hidden'
                }}>{note.content}</p>
                <button
                  onClick={() => toggleExpand(note._id)}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0, marginBottom: 12, textDecoration: 'underline' }}
                >
                  {expandedNotes[note._id] ? 'Show less' : 'Show more'}
                </button>

                {note.images && note.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {note.images.map((img, i) => (
                    <img
                      key={i}
                      src={`http://${window.location.hostname}:5001${img}`}
                      alt=""
                      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ))}
                </div>
              )}

                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={() => setStudyNote(note)} style={{ fontSize: 12, padding: '2px 6px', background: '#151df5', color: '#f7f4f4', border: 'none', borderRadius: 4 }} >Study</button>
                  <button onClick={() => startEdit(note)} style={{ fontSize: 12, padding: '2px 6px', background: '#129542', color: '#f7f4f4', border: 'none', borderRadius: 4 }} >Edit</button>
                  <button onClick={() => handleDelete(note._id)} style={{ fontSize: 12, padding: '2px 6px', background: '#ff4d4d', color: '#f7f4f4', border: 'none', borderRadius: 4 }} >Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {studyNote && (
        <StudyModal
          note={studyNote}
          onClose={() => setStudyNote(null)}
          onUpdate={(updated) => {
            setStudyNote(updated);
            loadCategories();
            loadNotes(activeCategory);
          }}
        />
      )}

      {studyingAlbum && (
        <AlbumStudyModal
          categoryName={activeCategory}
          notes={notes}
          onClose={() => setStudyingAlbum(false)}
        />
      )}
    </div>
  );
}

export default App;