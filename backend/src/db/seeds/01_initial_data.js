const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 1. Seed PAM Organization
  const [pamOrg] = await knex('organizations').where('orgId', 'PAM');
  if (!pamOrg) {
    await knex('organizations').insert({
      orgId: 'PAM',
      name: 'PAM',
      picName: 'Affan',
      picEmail: 'affan.ridha@pam-group.com',
      totalQuota: 100
    });
  }

  // 2. Seed PAM Company
  const [pamComp] = await knex('companies').where('companyId', 'PAM');
  let pamId;
  if (!pamComp) {
    [pamId] = await knex('companies').insert({
      companyId: 'PAM',
      orgId: 'PAM',
      name: 'Ewalk Pentacity Mall',
      type: 'internal',
      timezone: 'UTC+07:00',
      address: 'Not Set',
      phone: '6285200000000',
      status: 'Aktif'
    });
  } else {
    pamId = pamComp.id;
  }

  // 3. Seed PAM Departments
  const depts = await knex('departments').where('company_id', pamId);
  if (depts.length === 0) {
    const list = ['IT', 'HR & GA', 'OPERASIONAL', 'BUILDING MAINTENANCE'];
    const deptInserts = list.map(n => ({
      name: n,
      dept_id: n.substring(0, 3),
      company_id: pamId
    }));
    await knex('departments').insert(deptInserts);
  }

  // 4. Seed Initial User
  const [adminUser] = await knex('users').where('email', 'adil@gmail.com');
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('adil', 10);
    await knex('users').insert({
      orgId: 'PAM',
      company_id: pamId,
      email: 'adil@gmail.com',
      password: hashedPassword,
      firstName: 'Adil',
      role: 'Super Admin',
      department: 'IT',
      userType: 'admin'
    });
  }

  // 5. Seed Default Asset Priorities
  const prioCount = await knex('asset_priorities').count('id as count').first();
  if (prioCount.count === 0) {
    await knex('asset_priorities').insert([
      { label: 'Rendah' },
      { label: 'Sedang' },
      { label: 'Tinggi' }
    ]);
  }

  // 6. Seed Default Asset Statuses
  const statusCount = await knex('asset_statuses').count('id as count').first();
  if (statusCount.count === 0) {
    await knex('asset_statuses').insert([
      { label: 'Baik' },
      { label: 'Maintenance' },
      { label: 'Rusak' }
    ]);
  }
};
