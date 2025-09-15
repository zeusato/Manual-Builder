// scripts/deploy.cjs
const ghpages = require('gh-pages');

ghpages.publish('dist', {
  branch: 'gh-pages',
  history: false,   // nhanh, gọn
  dotfiles: true,
  remove: '.',      // <== mấu chốt: chạy "git rm -r -f ." thay vì liệt kê hàng ngàn file
  message: 'deploy',
}, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('✅ Deployed to gh-pages');
});
