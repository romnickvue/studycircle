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
  }
};

window.ProgressService = ProgressService;