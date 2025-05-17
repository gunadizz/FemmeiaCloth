const shortLinks = {
  "earab-inner": "https://id.shp.ee/ch6NCEG",
  "pashmina-kaos": "https://id.shp.ee/yHZgf13",
  "paris-greyblue": "https://id.shp.ee/rHFahey",
  "paris-chocorust": "https://id.shp.ee/L2JhHGu",
  "paris-redwood": "https://id.shp.ee/5CWXnNy",
  "shopee": "https://id.shp.ee/wAvRoJs",
  "instagram": "https://instagram.com/femmeia.cloth",
  "wa-admin2": "https://wa.me/6285341899229",
  "wa-admin1": "https://wa.me/6287771420644"
};

const path = window.location.pathname.replace("/p/", "");
const targetUrl = shortLinks[path];

if (targetUrl) {
  window.location.href = targetUrl;
} else {
  document.body.innerHTML = "<h2>404 - Link not found</h2>";
}
