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
  },

    async update(activityId, { subjectId, title, description, activityType, dueAt }) {
    const { data, error } = await supabaseClient
      .from('academic_activities')
      .update({
        subject_id: subjectId || null,
        title,
        description: description || null,
        activity_type: activityType,
        due_at: dueAt || null
      })
      .eq('id', activityId)
      .select();
    return { updated: data && data.length > 0, error };
  },

  async remove(activityId) {
    const { error } = await supabaseClient
      .from('academic_activities')
      .delete()
      .eq('id', activityId);
    return { error };
  },

  async listMine() {
    const { groups } = await GroupsService.listMine();
    const groupIds = groups.map((g) => g.id);

    if (groupIds.length === 0) {
      return { activities: [], error: null };
    }

    const { data, error } = await supabaseClient
      .from('academic_activities')
      .select('*, subjects(name), groups(name)')
      .in('group_id', groupIds)
      .order('due_at', { ascending: true, nullsFirst: false });

    return { activities: data ?? [], error };
  },

  async countThisWeek(groupId) {
    const { start, end } = getCurrentWeekWindow();
    const { count, error } = await supabaseClient
      .from('academic_activities')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .not('due_at', 'is', null)
      .gte('due_at', start.toISOString())
      .lt('due_at', end.toISOString());
    return { count: count || 0, error };
  }
};

window.ActivitiesService = ActivitiesService;

  