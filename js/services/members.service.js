const MembersService = {
  async list(groupId) {
    const { data, error } = await supabaseClient
      .from('group_memberships')
      .select('id, user_id, role, joined_at, profiles(display_name)')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });
    return { members: data ?? [], error };
  },

  async promote(groupId, userId) {
    const { error } = await supabaseClient.rpc('promote_member', {
      p_group_id: groupId,
      p_user_id: userId
    });
    return { error };
  },

  async demote(groupId, userId) {
    const { error } = await supabaseClient.rpc('demote_member', {
      p_group_id: groupId,
      p_user_id: userId
    });
    return { error };
  },

  async remove(groupId, userId) {
    const { error } = await supabaseClient.rpc('remove_member', {
      p_group_id: groupId,
      p_user_id: userId
    });
    return { error };
  },

  async leave(groupId) {
    const { error } = await supabaseClient.rpc('leave_group', {
      p_group_id: groupId
    });
    return { error };
  }
};

window.MembersService = MembersService;