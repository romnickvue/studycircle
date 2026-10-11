const AuthService = {
  async register(email, password, displayName) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });
    return { data, error };
  },

  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  },

  async getSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    return { session: data?.session ?? null, error };
  }
};

window.AuthService = AuthService;