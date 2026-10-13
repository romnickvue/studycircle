const GroupsService = {
  async create(name, description) {
    const { data, error } = await supabaseClient.rpc('create_group_with_owner', {
      p_name: name,
      p_description: description
    });
    return { groupId: data, error };
  },

  async listMine() {
    const { data, error } = await supabaseClient
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });
    return { groups: data ?? [], error };
  },

  async getById(groupId) {
    const { data, error } = await supabaseClient
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
    return { group: data, error };
  },

  async update(groupId, name, description) {
  const { data, error } = await supabaseClient
      .from('groups')
      .update({ name, description })
      .eq('id', groupId)
      .select();
    return { updated: data && data.length > 0, error };
  }
};

window.GroupsService = GroupsService;