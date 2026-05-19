const knex = require('../src/config/knex');

async function seed() {
  try {
    const pamComp = await knex('companies').where('companyId', 'PAM').first();
    if (!pamComp) {
      console.log('Error: Company with companyId PAM not found!');
      process.exit(1);
    }
    const companyId = pamComp.id;
    console.log(`Using companyId: ${companyId}`);

    const requestedDepts = [
      'EWALK',
      'PENTACITY',
      'DEVELOPER',
      'ESTATE',
      'CNC',
      'Operation',
      'FA',
      'Engineer E-Walk',
      'Engineer Pentacity',
      'Customer Service E-Walk',
      'Customer Service Pentacity',
      'Purchasing',
      'FIX Asset'
    ];

    // Get current departments
    const currentDepts = await knex('departments').where('company_id', companyId);
    const currentNames = currentDepts.map(d => d.name.toLowerCase());

    let idx = currentDepts.length + 1;

    for (const name of requestedDepts) {
      if (!currentNames.includes(name.toLowerCase())) {
        const dept_id = `DEP-${String(idx).padStart(3, '0')}`;
        await knex('departments').insert({
          name: name,
          dept_id: dept_id,
          company_id: companyId,
          status: 'Aktif'
        });
        console.log(`Inserted: ${name} with ID: ${dept_id}`);
        idx++;
      } else {
        console.log(`Already exists: ${name}`);
      }
    }

    console.log('Done seeding departments!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding departments:', err);
    process.exit(1);
  }
}

seed();
