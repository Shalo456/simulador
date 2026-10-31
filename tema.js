/* Alternar tema claro/oscuro */
document.getElementById('th').onclick=()=>{const d=document.documentElement,dk=d.dataset.theme?d.dataset.theme=='dark':matchMedia('(prefers-color-scheme:dark)').matches;d.dataset.theme=dk?'light':'dark'};
