const SubjectsService = {
    async create(groupId, name, code, description) {
    const { session } = await AuthService.getSession();

    const { data, error } = await supabaseClient
      .from('subjects')
      .insert({
        group_id: groupId,
        name,
        code: code || null,
        description: description || null,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error && error.code === '23505') {
      return { subject: null, error: { message: 'A subject with this name already exists in this group.' } };
    }

    return { subject: data, error };
  },

  async listByGroup(groupId) {
    const { data, error } = await supabaseClient
      .from('subjects')
      .select('*')
      .eq('group_id', groupId)
      .order('name', { ascending: true });
    return { subjects: data ?? [], error };
  },

  async update(subjectId, name, code, description) {
    const { data, error } = await supabaseClient
      .from('subjects')
      .update({ name, code: code || null, description: description || null })
      .eq('id', subjectId)
      .select();
    return { updated: data && data.length > 0, error };
  },

  async remove(subjectId) {
    const { error } = await supabaseClient
      .from('subjects')
      .delete()
      .eq('id', subjectId);
    return { error };
  }
};

window.SubjectsService = SubjectsService;