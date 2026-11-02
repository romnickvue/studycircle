const TrashService = {
  async archiveGroup(groupId) {
    const { error } = await supabaseClient.rpc('archive_group', { p_group_id: groupId });
    return { error };
  },

  async restoreGroup(groupId) {
    const { error } = await supabaseClient.rpc('restore_group', { p_group_id: groupId });
    return { error };
  },

  async permanentlyDeleteGroup(groupId) {
    const { error } = await supabaseClient.rpc('permanently_delete_group', { p_group_id: groupId });
    return { error };
  },

  async listGroups() {
    const { data, error } = await supabaseClient.rpc('list_trashed_groups');
    return { groups: data ?? [], error };
  },

  async listTasks() {
    const { data, error } = await supabaseClient.rpc('list_trashed_tasks');
    return { tasks: data ?? [], error };
  },

  async restoreTasksAsPersonal(groupId) {
    const { error } = await supabaseClient.rpc('restore_tasks_as_personal', { p_group_id: groupId });
    return { error };
  }
};

window.TrashService = TrashService;