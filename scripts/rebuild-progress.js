/**
 * Rebuilds books-progress.json from authoritative D1 data.
 * Run: node scripts/rebuild-progress.js
 */
const fs = require('fs');
const path = require('path');

const CSV_PATH = 'docs/onboarding/maximo-expo/files/moodle_books.csv';
const OUT_PATH = 'docs/onboarding/maximo-expo/files/books-progress.json';

// Parse CSV to get section_name per book title
const csv = fs.readFileSync(CSV_PATH, 'utf8');
const lines = csv.split(/\r?\n/).slice(1).filter(l => l.trim());
const sectionMap = {};
for (const line of lines) {
  const fields = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
    else cur += ch;
  }
  fields.push(cur);
  // CSV columns: title, slug, type, section_name, course
  const bookTitle = fields[0];
  const sectionName = fields[3];
  if (bookTitle && !sectionMap[bookTitle]) sectionMap[bookTitle] = sectionName;
}

// Authoritative D1 data (from D1 query results, never regenerate these IDs)
const d1 = [
  { title: ' SISTEMA DIGESTIVO PRESENTACION', l: 'les_f3d4f97bb48187168f', d: 'doc_455ced1c77a31f7e99', u: 'up_089686d94475c2854f', r: 'maximo-expo/books/sistema-digestivo-presentacion.pdf', f: 'sistema-digestivo-presentacion.pdf', s: 12159653 },
  { title: ' SISTEMA INMUNE PRESENTACION', l: 'les_3d1c86dbce65209a27', d: 'doc_92e5f49c6c19f0176d', u: 'up_7286915bf5d36bd088', r: 'maximo-expo/books/sistema-inmune-presentacion.pdf', f: 'sistema-inmune-presentacion.pdf', s: 4247831 },
  { title: ' SISTEMA TEGUMENTARIO', l: 'les_352ddf3fafc13a63c2', d: 'doc_173aeb1945611ec576', u: 'up_3dbe514b3b53bca672', r: 'maximo-expo/books/sistema-tegumentario.pdf', f: 'sistema-tegumentario.pdf', s: 543013 },
  { title: 'EJIDO CONECTIVO PRESENTACION', l: 'les_545003db1a6ff05be1', d: 'doc_2e822fc0aaa7640245', u: 'up_630fd47c11c31723c6', r: 'maximo-expo/books/ejido-conectivo-presentacion.pdf', f: 'ejido-conectivo-presentacion.pdf', s: 4023771 },
  { title: 'EJIDO GLANDULAR PRESENTACION', l: 'les_5c8caed180e0f68c36', d: 'doc_9d1fde3c76fe9886a1', u: 'up_ca6b560912a10a6812', r: 'maximo-expo/books/ejido-glandular-presentacion.pdf', f: 'ejido-glandular-presentacion.pdf', s: 6285743 },
  { title: 'ISTEMA REPRODUCTOR FEMENINO PRESENTACION', l: 'les_896334928042077ec0', d: 'doc_2a0f33f300ba8e4d5a', u: 'up_81365a4e437702e336', r: 'maximo-expo/books/istema-reproductor-femenino-presentacion.pdf', f: 'istema-reproductor-femenino-presentacion.pdf', s: 5714800 },
  { title: 'ISTEMA RESPIRATORIO PRESENTACION', l: 'les_79cc7585a2677eda63', d: 'doc_1e4c758b8248336823', u: 'up_0b155269437fef0ade', r: 'maximo-expo/books/istema-respiratorio-presentacion.pdf', f: 'istema-respiratorio-presentacion.pdf', s: 5482420 },
  { title: 'REPRODUCTOR FEMENINO', l: 'les_8dccf2f426549090c1', d: 'doc_cd1b91722b2f87e108', u: 'up_d5e225fbd7bd2ec8b5', r: 'maximo-expo/books/reproductor-femenino.pdf', f: 'reproductor-femenino.pdf', s: 797992 },
  { title: 'REPRODUCTOR MASCULINO', l: 'les_f4da76db54c41b4f98', d: 'doc_8bf3a2acc4f578f817', u: 'up_955edc965d31cc3b3e', r: 'maximo-expo/books/reproductor-masculino.pdf', f: 'reproductor-masculino.pdf', s: 533921 },
  { title: 'SISTEMA AUDITIVO', l: 'les_5c36fbf77273377526', d: 'doc_95ade1ecac366c6657', u: 'up_79824bdee968953820', r: 'maximo-expo/books/sistema-auditivo.pdf', f: 'sistema-auditivo.pdf', s: 310837 },
  { title: 'SISTEMA AUDITIVO PRESENTACION', l: 'les_924ebd38a3b93b7068', d: 'doc_df62974e699cb7b2cb', u: 'up_eb47c5f682f7f6d3ac', r: 'maximo-expo/books/sistema-auditivo-presentacion.pdf', f: 'sistema-auditivo-presentacion.pdf', s: 2359692 },
  { title: 'SISTEMA CARDIOVASCULAR', l: 'les_5ec2e2177af1c34ca6', d: 'doc_fe8bee4ab9175a7195', u: 'up_1963902ac9cb427a63', r: 'maximo-expo/books/sistema-cardiovascular.pdf', f: 'sistema-cardiovascular.pdf', s: 696085 },
  { title: 'SISTEMA CARDIOVASCULAR PRESENTACION', l: 'les_b2fcb114bde3529930', d: 'doc_65a42bcb59056ed955', u: 'up_f2119d14533e8ab1ee', r: 'maximo-expo/books/sistema-cardiovascular-presentacion.pdf', f: 'sistema-cardiovascular-presentacion.pdf', s: 5009949 },
  { title: 'SISTEMA DIGESTIVO', l: 'les_33230de2008b071ac7', d: 'doc_065da591789e3e563a', u: 'up_8416201e835c9487b1', r: 'maximo-expo/books/sistema-digestivo.pdf', f: 'sistema-digestivo.pdf', s: 1713673 },
  { title: 'SISTEMA ENDOCRINO PRESENTACION', l: 'les_831acc8cdc2b8f8161', d: 'doc_441ccdb59ee817ed3d', u: 'up_7bed769aa907020c05', r: 'maximo-expo/books/sistema-endocrino-presentacion.pdf', f: 'sistema-endocrino-presentacion.pdf', s: 3896564 },
  { title: 'SISTEMA INMUNE', l: 'les_dec860c45d3ed2f1b7', d: 'doc_981e08f8c4b643bf9a', u: 'up_2f12f02f2ed0d2691b', r: 'maximo-expo/books/sistema-inmune.pdf', f: 'sistema-inmune.pdf', s: 387411 },
  { title: 'SISTEMA NERVIOSO', l: 'les_ab7c79a19c12a587cd', d: 'doc_642494386c6894a410', u: 'up_b8484c4779092e5284', r: 'maximo-expo/books/sistema-nervioso.pdf', f: 'sistema-nervioso.pdf', s: 496008 },
  { title: 'SISTEMA NERVIOSO PRESENTACION', l: 'les_e3ddfda0a331406447', d: 'doc_82abd1c3004814f2e1', u: 'up_e775194bc6372095dc', r: 'maximo-expo/books/sistema-nervioso-presentacion.pdf', f: 'sistema-nervioso-presentacion.pdf', s: 4730328 },
  { title: 'SISTEMA REPRODUCTOR MASCULINO PRESENTACION', l: 'les_593151e78892d57b52', d: 'doc_a86a39afb4de837f83', u: 'up_804f9b9cdccf587f13', r: 'maximo-expo/books/sistema-reproductor-masculino-presentacion.pdf', f: 'sistema-reproductor-masculino-presentacion.pdf', s: 3662248 },
  { title: 'SISTEMA RESPIRATORIO', l: 'les_a4c2d6e7abd6ff6d1d', d: 'doc_43bd49be058d590b66', u: 'up_1075049a13a6448bbd', r: 'maximo-expo/books/sistema-respiratorio.pdf', f: 'sistema-respiratorio.pdf', s: 518405 },
  { title: 'SISTEMA TEGUMENTARIO PRESENTACION', l: 'les_ea657d63374ad8b12c', d: 'doc_70df9b7d8cc3b2478d', u: 'up_ba465a9070a67f0334', r: 'maximo-expo/books/sistema-tegumentario-presentacion.pdf', f: 'sistema-tegumentario-presentacion.pdf', s: 2988220 },
  { title: 'SISTEMA URINARIO PRESETACION', l: 'les_4166cbdcb2d2efe3bb', d: 'doc_b0065a92b039c2ae31', u: 'up_65d7eac19380f0b374', r: 'maximo-expo/books/sistema-urinario-presetacion.pdf', f: 'sistema-urinario-presetacion.pdf', s: 104980 },
  { title: 'SISTEMA VISUAL', l: 'les_a48eaed05abf69873c', d: 'doc_278db0fa83859a7476', u: 'up_88ab110ad31ce56d80', r: 'maximo-expo/books/sistema-visual.pdf', f: 'sistema-visual.pdf', s: 419028 },
  { title: 'SISTEMA VISUAL PRESENTACION', l: 'les_5708488cdb185185d0', d: 'doc_b7c89ec7196e21cdb2', u: 'up_c4695e6ef93fb4b92b', r: 'maximo-expo/books/sistema-visual-presentacion.pdf', f: 'sistema-visual-presentacion.pdf', s: 2764046 },
  { title: 'TEJIDO CARTILAGINOSO PRESENTACION', l: 'les_9cd32d7f4a7efa6374', d: 'doc_58637698de612c63bd', u: 'up_891c207186eb62e876', r: 'maximo-expo/books/tejido-cartilaginoso-presentacion.pdf', f: 'tejido-cartilaginoso-presentacion.pdf', s: 1561829 },
  { title: 'TEJIDO ENDOCRINO', l: 'les_18b66c8a9dd1f1aa3f', d: 'doc_01bfc63fa3c47aff10', u: 'up_f65f5f3220c7d1eec8', r: 'maximo-expo/books/tejido-endocrino.pdf', f: 'tejido-endocrino.pdf', s: 493755 },
  { title: 'TEJIDO EPITELIAL PRESENTACION', l: 'les_6e0d49800d7fdb0688', d: 'doc_8f0dca4d0cbd003c9d', u: 'up_d745fb0be36c2edbec', r: 'maximo-expo/books/tejido-epitelial-presentacion.pdf', f: 'tejido-epitelial-presentacion.pdf', s: 2880036 },
  { title: 'TEJIDO MUSCULAR PRESENTACION', l: 'les_72dc224477d49cf656', d: 'doc_db370871b490f5d32d', u: 'up_3471442f03f0e2f71c', r: 'maximo-expo/books/tejido-muscular-presentacion.pdf', f: 'tejido-muscular-presentacion.pdf', s: 2321787 },
  { title: 'TEJIDO OSEO PRESENTACION', l: 'les_18aae5b9db20fb40e0', d: 'doc_962e8c7ce3faf5feaa', u: 'up_046bc3e81a9d12ab6f', r: 'maximo-expo/books/tejido-oseo-presentacion.pdf', f: 'tejido-oseo-presentacion.pdf', s: 2813461 },
  { title: 'TEJIDO SANGUÍNEO', l: 'les_4007d9b74a1b74d56f', d: 'doc_9ecbd16fc302785ef0', u: 'up_f87795dddab8770e9b', r: 'maximo-expo/books/tejido-sanguineo.pdf', f: 'tejido-sanguineo.pdf', s: 393704 },
  { title: 'TEJIDO SANGUÍNEO PRESENTACION', l: 'les_a6e4b60ecaff7e6b79', d: 'doc_23ef279844f74528bf', u: 'up_3e361233b5c5bc6ea5', r: 'maximo-expo/books/tejido-sanguineo-presentacion.pdf', f: 'tejido-sanguineo-presentacion.pdf', s: 2373228 },
  { title: 'TEJIDO URINARIO', l: 'les_0b5c4e4ba2164b2039', d: 'doc_40270560504d677b70', u: 'up_e9489da29c30e64b77', r: 'maximo-expo/books/tejido-urinario.pdf', f: 'tejido-urinario.pdf', s: 647879 },
  { title: 'TIPOS DE CARTILAGO', l: 'les_31761e88afc122decc', d: 'doc_d514f89a0344dff78d', u: 'up_ee989529aa66e0c78c', r: 'maximo-expo/books/tipos-de-cartilago.pdf', f: 'tipos-de-cartilago.pdf', s: 317886 },
  { title: 'TIPOS DE EPITELIOS', l: 'les_8698c3ce7fd862a40f', d: 'doc_fed187a33548cf8b19', u: 'up_73ff6075a264fd5660', r: 'maximo-expo/books/tipos-de-epitelios.pdf', f: 'tipos-de-epitelios.pdf', s: 592104 },
  { title: 'TIPOS DE GLANDULAS SEGUN SU ESTRUCTURA', l: 'les_9c6fc23d4ad34c982a', d: 'doc_89470d1289d801ab01', u: 'up_31dc6ea1f62edeed18', r: 'maximo-expo/books/tipos-de-glandulas-segun-su-estructura.pdf', f: 'tipos-de-glandulas-segun-su-estructura.pdf', s: 380495 },
  { title: 'TIPOS DE HUESOS', l: 'les_662d804c8df7a08510', d: 'doc_76ab25587db8a878e0', u: 'up_2a5d9a09e0c58833c8', r: 'maximo-expo/books/tipos-de-huesos.pdf', f: 'tipos-de-huesos.pdf', s: 437589 },
  { title: 'TIPOS DE TEJIDO ADIPOSO', l: 'les_ed4071e022d9fb6b31', d: 'doc_02c03a39ad6a5e5bf7', u: 'up_32124dbdb13374fc5e', r: 'maximo-expo/books/tipos-de-tejido-adiposo.pdf', f: 'tipos-de-tejido-adiposo.pdf', s: 200857 },
  { title: 'TIPOS DE TEJIDO CONECTIVO', l: 'les_730f72a526c5a834cf', d: 'doc_ade7b6f10c10ae6f00', u: 'up_084200fe3856491736', r: 'maximo-expo/books/tipos-de-tejido-conectivo.pdf', f: 'tipos-de-tejido-conectivo.pdf', s: 434335 },
  { title: 'TIPOS DE TEJIDO MUSCULAR', l: 'les_5496c9b8ae0eeee466', d: 'doc_ce0a5b650d9ea36ad8', u: 'up_4a80e6d43d7d157149', r: 'maximo-expo/books/tipos-de-tejido-muscular.pdf', f: 'tipos-de-tejido-muscular.pdf', s: 325928 },
  { title: 'TIPOS GLANDULAS EXOCRINAS', l: 'les_e96c93d236bd586dbe', d: 'doc_b9e4962c5873fb1bf4', u: 'up_24ea0da0e4aa08551a', r: 'maximo-expo/books/tipos-glandulas-exocrinas.pdf', f: 'tipos-glandulas-exocrinas.pdf', s: 376738 },
];

const progress = {};
for (const b of d1) {
  progress[b.title] = {
    title: b.title,
    course: 'Histología',
    section_name: sectionMap[b.title] || '',
    r2Key: b.r,
    pdfFilename: b.f,
    pdfSize: b.s,
    uploadId: b.u,
    lessonId: b.l,
    docId: b.d,
    done: true,
  };
}

fs.writeFileSync(OUT_PATH, JSON.stringify(progress, null, 2), 'utf8');
console.log(`Written ${Object.keys(progress).length} entries to ${OUT_PATH}`);

// Show which books have no section_name (lookup miss)
const missing = Object.values(progress).filter(e => !e.section_name);
if (missing.length) {
  console.warn('WARNING: No section_name found for:', missing.map(e => e.title));
}
