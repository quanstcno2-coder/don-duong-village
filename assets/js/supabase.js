
(function(){
  const cfg = window.DDV_CONFIG || {};
  window.ddvHasSupabase = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  window.ddvSupabase = window.ddvHasSupabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  window.ddvApi = {
    async settings(){
      if(!window.ddvSupabase) return window.DDV_DEMO.settings;
      const {data,error} = await window.ddvSupabase.from("site_settings").select("*").eq("id",1).maybeSingle();
      if(error || !data) return window.DDV_DEMO.settings;
      return data;
    },
    async sections(){
      if(!window.ddvSupabase) return window.DDV_DEMO.sections;
      const {data,error}=await window.ddvSupabase.from("page_sections").select("*").order("sort_order");
      if(error) return window.DDV_DEMO.sections;
      const map={};
      (data||[]).forEach(x=>map[x.section_key]=x);
      return {...window.DDV_DEMO.sections,...map};
    },
    async products(opts={}){
      if(!window.ddvSupabase) return window.DDV_DEMO.products;
      let q=window.ddvSupabase.from("product").select("*").order("created_at",{ascending:false});
      if(opts.featured) q=q.eq("is_featured",true);
      if(opts.limit) q=q.limit(opts.limit);
      const {data,error}=await q;
      return error?[]:(data||[]);
    },
    async product(id){
      if(!window.ddvSupabase) return null;
      const {data,error}=await window.ddvSupabase.from("product").select("*").eq("id",id).maybeSingle();
      return error?null:data;
    },
    async posts(limit){
      if(!window.ddvSupabase) return window.DDV_DEMO.posts;
      let q=window.ddvSupabase.from("posts").select("*").eq("status","published").order("published_at",{ascending:false});
      if(limit) q=q.limit(limit);
      const {data,error}=await q;
      return error?[]:(data||[]);
    },
    async post(slug){
      if(!window.ddvSupabase){
        return (window.DDV_DEMO.posts || []).find(p => p.slug === slug && p.status === "published") || null;
      }
      const {data,error}=await window.ddvSupabase.from("posts").select("*").eq("slug",slug).eq("status","published").maybeSingle();
      return error?null:data;
    },
    async aboutBlocks(){
      if(!window.ddvSupabase) return window.DDV_DEMO.about_blocks || [];
      const {data,error}=await window.ddvSupabase
        .from("about_blocks")
        .select("*")
        .eq("is_active",true)
        .order("sort_order",{ascending:true})
        .order("id",{ascending:true});
      return error ? (window.DDV_DEMO.about_blocks || []) : (data || []);
    }
  };
})();
