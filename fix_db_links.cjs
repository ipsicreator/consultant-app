const PocketBase = require('pocketbase/cjs');

async function fixDatabase() {
    const pb = new PocketBase('http://127.0.0.1:8090');

    try {
        // 1. 슈퍼 관리자 계정 로그인
        await pb.admins.authWithPassword('admin@admin.com', 'admin1234567890');
        const adminId = pb.authStore.model.id;
        console.log('Logged in Admin ID:', adminId);

        const academyId = 'suprema_main';

        // 2. Profile 수정 또는 생성 (admin_id 연결)
        let profile;
        try {
            profile = await pb.collection('profiles').getFirstListItem(`admin_id="${adminId}"`);
            await pb.collection('profiles').update(profile.id, {
                academy_id: academyId,
                role: 'Representative',
                name: '대표 컨설턴트'
            });
            console.log('Profile updated.');
        } catch (e) {
            profile = await pb.collection('profiles').create({
                admin_id: adminId,
                academy_id: academyId,
                role: 'Representative',
                name: '대표 컨설턴트'
            });
            console.log('Profile created.');
        }

        // 3. License 활성화 확인
        try {
            const license = await pb.collection('licenses').getFirstListItem(`academy_id="${academyId}"`);
            await pb.collection('licenses').update(license.id, {
                status: 'active',
                expires: '2030-12-31 23:59:59'
            });
            console.log('License updated.');
        } catch (e) {
            await pb.collection('licenses').create({
                academy_id: academyId,
                status: 'active',
                expires: '2030-12-31 23:59:59'
            });
            console.log('License created.');
        }

        // 4. Student 데이터 연결 (최우수 학생)
        const students = await pb.collection('students').getFullList();
        for (const student of students) {
            await pb.collection('students').update(student.id, {
                academy_id: academyId,
                enrollment_status: '수강중'
            });
        }
        console.log(`Updated ${students.length} students to enrollment_status: 수강중`);

        console.log('Database alignment complete. App should now display data.');
    } catch (error) {
        console.error('Error fixing database:', error);
    }
}

fixDatabase();
