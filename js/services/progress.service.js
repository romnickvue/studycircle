const ProgressService = {
  async getMine(activityId) {
    const { session } = await AuthService.getSession();

    const { data, error } = await supabaseClient
      .from('activity_progress')
      .select('status')
      .eq('activity_id', activityId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      return { status: null, error };
    }

    // Lazy creation (DATABASE.md §23): no row means NOT_STARTED
    return { status: data ? data.status : 'NOT_STARTED', error: null };
  },

  async setStatus(activityId, status) {
    const { session } = await AuthService.getSession();

    const { error } = await supabaseClient
      .from('activity_progress')
      .upsert({
        activity_id: activityId,
        user_id: session.user.id,
        status
      }, { onConflict: 'activity_id,user_id' });

    return { error };
  },

    async getManyMine(activityIds) {
    if (activityIds.length === 0) return { statusMap: {}, error: null };

    const { session } = await AuthService.getSession();

    const { data, error } = await supabaseClient
      .from('activity_progress')
      .select('activity_id, status')
      .eq('user_id', session.user.id)
      .in('activity_id', activityIds);

    if (error) return { statusMap: {}, error };

    const statusMap = {};
    data.forEach((row) => {
      statusMap[row.activity_id] = row.status;
    });

    return { statusMap, error: null };
  }
};

window.ProgressService = ProgressService;