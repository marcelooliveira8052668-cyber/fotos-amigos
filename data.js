// ============================================================
// Album - catalogo gerado a partir de fotos/ e videos/
// Gerado por gen_data.py - nao edite a mao, regenere o arquivo
// ============================================================

const PHOTOS = [
  "foto-01.jpeg",
  "foto-02.jpeg",
  "foto-03.jpeg",
  "foto-04.jpeg",
  "foto-05.jpeg",
  "foto-06.jpeg",
  "foto-07.jpeg",
  "foto-08.jpeg",
  "foto-09.jpeg",
  "foto-10.jpeg",
  "foto-11.jpeg",
  "foto-12.jpeg",
  "foto-13.jpeg",
  "foto-14.jpeg",
  "foto-15.jpeg",
  "foto-16.jpeg",
  "foto-17.jpeg",
  "foto-18.jpeg",
  "foto-19.jpeg",
  "foto-20.jpeg",
  "foto-21.jpeg",
  "foto-22.jpeg",
  "foto-23.jpeg",
  "foto-24.jpeg",
  "foto-25.jpeg",
  "foto-26.jpeg",
  "foto-27.jpeg",
  "foto-28.jpeg",
  "foto-29.jpeg",
  "foto-30.jpeg",
  "foto-31.jpeg",
  "foto-32.jpeg",
  "foto-33.jpeg",
  "foto-34.jpeg",
  "foto-35.jpeg",
  "foto-36.jpeg",
  "foto-37.jpeg",
  "foto-38.jpeg",
  "foto-39.jpeg",
  "foto-40.jpeg",
  "foto-41.jpeg",
  "foto-42.jpeg",
  "foto-43.jpeg",
  "foto-44.jpeg",
  "foto-45.jpeg",
  "foto-46.jpeg",
  "foto-47.jpeg",
  "foto-50.jpeg",
  "foto-55.jpeg",
  "IMG_0003.JPEG",
  "IMG_0009.JPEG",
  "IMG_0053.JPEG",
  "IMG_0054.JPEG",
  "IMG_0055.JPEG",
  "IMG_0056.JPEG",
  "IMG_0085.JPEG",
  "IMG_0100.JPG",
  "IMG_0123.JPEG",
  "IMG_0128.JPEG",
  "IMG_0135.JPEG",
  "IMG_0138.JPEG",
  "IMG_0139.JPEG",
  "IMG_0148.JPEG",
  "IMG_0149.JPEG",
  "IMG_0150.JPEG",
  "IMG_0151.JPEG",
  "IMG_0164.JPEG",
  "IMG_0177.JPEG",
  "IMG_0266.JPEG",
  "IMG_0272.JPEG",
  "IMG_0282.JPEG",
  "IMG_0285.JPEG",
  "IMG_0287.JPEG",
  "IMG_0293.JPEG",
  "IMG_0295.JPEG",
  "IMG_0297.JPEG",
  "IMG_0301.JPEG",
  "IMG_0303.JPEG",
  "IMG_0305.JPEG",
  "IMG_0307.JPEG",
  "IMG_0309.JPEG",
  "IMG_0310.JPG",
  "IMG_0315.JPEG",
  "IMG_0317.JPEG",
  "IMG_0318.JPEG",
  "IMG_0324.JPEG",
  "IMG_0334.JPEG",
  "IMG_0335.JPEG",
  "IMG_0340.JPG",
  "IMG_0401.JPEG",
  "IMG_0433.JPEG"
];

const VIDEOS = [
  "IMG_0069.MP4",
  "IMG_0129.MP4",
  "IMG_0136-MOV.mp4",
  "IMG_0140-MOV.mp4",
  "IMG_0313.MP4",
  "IMG_0417.MP4",
  "IMG_0418.MP4",
  "WhatsApp Video 2026-10-06 at 23.11.05.mp4"
];

// Organizar por colecoes (mesmos nomes dos filtros do site)
function getCollection(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith('foto-')) return 'viagens';
  if (lower.startsWith('img_')) return 'momentos';
  return 'memorias';
}

window.ALBUM_DATA = {
  images: PHOTOS,
  videos: VIDEOS,
  getCollection
};

console.log('Album carregado: ' + PHOTOS.length + ' fotos, ' + VIDEOS.length + ' videos');
