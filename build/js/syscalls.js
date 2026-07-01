











addToLibrary({
  
  
  
  
  
  
  __syscall_getrusage: (who, usage) => {
    if (usage) HEAPU8.fill(0, usage, usage + 32);
    return 0;
  },
  
  
  
  
  
  __syscall_prlimit64: (pid, resource, new_limit, old_limit) => {
    if (old_limit) HEAPU8.fill(0xff, old_limit, old_limit + 16);
    return 0;
  },
  
  
  
  
  __syscall_sigaltstack: (ss, old_ss) => 0,
});
