const InvitationsService = {
  async generate(groupId) {
    const { data, error } = await supabaseClient.rpc('generate_group_invitation', {
      p_group_id: groupId
    });
    return { code: data, error };
  },

  async getActive(groupId) {
    const { data, error } = await supabaseClient
      .from('group_invitations')
      .select('code, expires_at')
      .eq('group_id', groupId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { invitation: data, error };
  },

  async preview(code) {
    const { data, error } = await supabaseClient.rpc('preview_invitation', {
      p_code: code
    });
    return { result: data, error };
  },

  async accept(code) {
    const { data, error } = await supabaseClient.rpc('accept_group_invitation', {
      p_code: code
    });
    return { result: data, error };
  }
};

window.InvitationsService = InvitationsService;