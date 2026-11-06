# Mağaza yorumları

Museums of Türkiye (App Store) ve MüzeKart (Play Store) yorumlarını tarayıcıda filtrelemek, temalara ayırmak ve okumak için statik bir panel. Sunucu, hesap ve API anahtarı yok. Yorumlar `public/data/` altındaki JSON dosyalarından yüklenir.

## Lokal

```bash
npm install
npm run dev
```

Vite’ın yazdığı adresi aç. `npm test` filtre, tema ve istatistik davranışını çalıştırır. Derlenmiş hali görmek için:

```bash
npm run build
npm run preview
```

`index.html` dosyasını diskten çift tıklayarak açma. Tarayıcı JSON dosyalarını ancak bir sunucu üzerinden okuyabilir. `npm run dev` ve `npm run preview` bunu sağlar.

## Sonra ücretsiz yayın

`npm run build` klasörü `dist/` olur. Bu klasör olduğu gibi statik hostinge konabilir:

- Cloudflare Pages: build komutu `npm run build`, çıktı `dist`
- Netlify: aynı ayar
- GitHub Pages: `main` dalına her gönderimde Actions siteyi yayınlar. Adres `https://berking27.github.io/app-Rating-Web-app/` olur. Depoda **Settings → Pages → Source** değeri **GitHub Actions** olmalıdır.

Kod değişmeden aynı derleme herkese açık adreste çalışır. Yorum metinleri mağazalarda zaten herkese açıktır.
