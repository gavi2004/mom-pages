  const galleries = {
    1: ['imagen1a.jpg', 'imagen1b.jpg', 'imagen1c.jpg'],
    2: ['imagen2a.jpg', 'imagen2b.jpg', 'imagen2c.jpg'],
    3: ['imagen3a.jpg', 'imagen3b.jpg', 'imagen3c.jpg'],
    4: ['imagen4a.jpg', 'imagen4b.jpg', 'imagen4c.jpg'],
    5: ['imagen5a.jpg', 'imagen5b.jpg', 'imagen5c.jpg']
  };

  function openGallery(id) {
    const galleryContent = document.getElementById('galleryContent');
    galleryContent.innerHTML = ''; 
    const images = galleries[id];
    const container = document.createElement('div');
   

    images.forEach(src => {
      const img = document.createElement('img');
      img.src = `./img/Gallery/${src}`;
      console.log(src);
      container.appendChild(img);
    });

    galleryContent.appendChild(container);
    document.getElementById('galleryModal').style.display = 'block';
  }

  function closeGallery() {
    document.getElementById('galleryModal').style.display = 'none';
  }
