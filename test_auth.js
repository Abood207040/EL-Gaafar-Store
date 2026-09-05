import { supabase } from './src/services/authService.js';

async function testAuth() {
  console.log('getting session...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('session:', sessionData, sessionError);
  
  console.log('getting user...');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log('user:', userData, userError);
  
  if (userData?.user) {
    console.log('getting profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();
    console.log('profile:', profileData, profileError);
  }
}

testAuth().catch(console.error);
