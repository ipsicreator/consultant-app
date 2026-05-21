const PB_URL = 'https://suprima-platform-pb.fly.dev';
const ADMIN_EMAIL = 'chrisklee69@gmail.com';
const ADMIN_PASSWORD = 'aussie1996@@';

async function main() {
  console.log('1. Logging in as Admin...');
  const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!authRes.ok) {
    console.error('Admin authentication failed:', await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.token;
  console.log('Admin login success.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Find user by email
  console.log('2. Finding user...');
  const usersRes = await fetch(`${PB_URL}/api/collections/users/records?filter=email%3D%22${ADMIN_EMAIL}%22`, { headers });
  if (!usersRes.ok) {
    console.error('Failed to query users:', await usersRes.text());
    return;
  }

  const usersData = await usersRes.json();
  if (usersData.items.length === 0) {
    console.log('User not found. Creating new user...');
    const createRes = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: 'aussie1996@@@',
        passwordConfirm: 'aussie1996@@@',
        emailVisibility: true,
        verified: true
      })
    });
    if (createRes.ok) {
      console.log('User created successfully with password: aussie1996@@@');
    } else {
      console.error('Failed to create user:', await createRes.text());
    }
  } else {
    const user = usersData.items[0];
    console.log(`Found user: ${user.id}. Resetting password to "aussie1996@@@"`);
    const updateRes = await fetch(`${PB_URL}/api/collections/users/records/${user.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        password: 'aussie1996@@@',
        passwordConfirm: 'aussie1996@@@'
      })
    });
    if (updateRes.ok) {
      console.log('User password updated successfully to: aussie1996@@@');
    } else {
      console.error('Failed to update user password:', await updateRes.text());
    }
  }

  // Also make sure they have a profile with admin role if master permissions are needed
  console.log('3. Checking profile for user...');
  const url = `${PB_URL}/api/collections/suprima_profiles/records?filter=email%3D%22${encodeURIComponent(ADMIN_EMAIL)}%22`;
  const profileRes = await fetch(url, { headers });
  if (profileRes.ok) {
    const profileData = await profileRes.json();
    if (profileData.items.length > 0) {
      const profile = profileData.items[0];
      console.log(`Found profile: ${profile.id}, role: ${profile.role}`);
      if (profile.role !== 'admin') {
        console.log('Updating profile role to "admin" for master privileges...');
        const profileUpdateRes = await fetch(`${PB_URL}/api/collections/suprima_profiles/records/${profile.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ role: 'admin' })
        });
        if (profileUpdateRes.ok) {
          console.log('Profile role updated to admin successfully.');
        } else {
          console.error('Failed to update profile role:', await profileUpdateRes.text());
        }
      } else {
        console.log('Profile role is already admin (master).');
      }
    } else {
      console.log('No profile found for email. Let us create a suprima_profiles entry...');
      // Get the user ID from users collection
      const finalUsersRes = await fetch(`${PB_URL}/api/collections/users/records?filter=email%3D%22${ADMIN_EMAIL}%22`, { headers });
      const finalUsersData = await finalUsersRes.json();
      const finalUserId = finalUsersData.items[0].id;
      
      const profileCreateRes = await fetch(`${PB_URL}/api/collections/suprima_profiles/records`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          full_name: 'Chris Lee',
          role: 'admin',
          academy_id: 'suprema_main',
          user: finalUserId
        })
      });
      if (profileCreateRes.ok) {
        console.log('Profile created successfully with role admin linked to user.');
      } else {
        console.error('Failed to create profile:', await profileCreateRes.text());
      }
    }
  } else {
    console.error('Failed to fetch suprima_profiles:', profileRes.status, await profileRes.text());
  }
}

main().catch(console.error);
