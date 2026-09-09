# Semih vs Baron Özcan — Neon Dövüş

Mobil tarayıcı için hazırlanmış dokunmatik kontrollü HTML5 Canvas arcade dövüş oyunudur. Oyuncu açılışta Semih, Muharrem veya Baron Özcan'ı seçer; ardından bilgisayarın yöneteceği rakibi belirler. Maçı kazanmak için iki raund almak gerekir ve her raund 60 saniyedir.

Dövüşçülerin 140 canı vardır. Normal saldırı 5, özel saldırı 18 hasar verir ve saldırılar arasında kısa bir toparlanma süresi bulunur.

Mobilde kontroller oyun alanının üzerinde konumlanır. Maç başlatılırken tam ekran modu istenir; ayrıca sağ üstte tam ekran düğmesi bulunur.

## Yerel çalıştırma

Proje kökünde basit bir statik sunucu açın:

```bash
python -m http.server 8000 --directory dist
```

Ardından `http://localhost:8000` adresini açın.

## Render kurulumu

1. Bu klasörü GitHub deposuna yükleyin.
2. Render'da **New > Static Site** seçin.
3. Depoyu bağlayın.
4. **Build Command** alanını boş bırakın.
5. **Publish Directory** alanına `dist` yazın.

## Kontroller

- Mobil: yön, zıplama, yumruk, savunma ve özel saldırı düğmeleri
- Klavye: A/D veya yön tuşları, W/↑ zıplama, F/Boşluk yumruk, S savunma, G özel saldırı
- Özel saldırı, yeşil enerji çubuğu tamamen dolduğunda kullanılabilir.
