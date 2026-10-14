const ActivitiesService = {
  async create(groupId, { subjectId, title, description, activityType, startsAt, dueAt, location, externalUrl }) {
    const { session } = await AuthService.getSession();

    const { data, error } = await supabaseClient
      .from('academic_activities')
      .insert({
        group_id: groupId,
        subject_id: subjectId || null,
        created_by: session.user.id,
        title,
        description: description || null,
        activity_type: activityType,
        starts_at: startsAt || null,
        due_at: dueAt || null,
        location: location || null,
        external_url: externalUrl || null
      })
      .select()
      .single();

    return { activity: data, error };
  },

  async listByGroup(groupId) {
    const { data, error } = await supabaseClient
      .from('academic_activities')
      .select('*, subjects(name)')
      .eq('group_id', groupId)
      .order('due_at', { ascending: true, nullsFirst: false });
    return { activities: data ?? [], error };
  },

  async getById(activityId) {
  const { data, error } = await supabaseClient
      .from('academic_activities')
      .select('*, subjects(name)')
      .eq('id', activityId)
      .single();
    return { activity: data, error };
  }
};

window.ActivitiesService = ActivitiesService;