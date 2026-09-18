
(function(){
  const cfg = window.DDV_CONFIG || {};
  window.ddvHasSupabase = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  window.ddvSupabase = window.ddvHasSupabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  window.ddvApi = {
    async categories(){
      if(!window.ddvSupabase)return [];
      const rows=[];
      for(let offset=0;;){
        const {data,error}=await ddvSupabase.from('product_categories').select('id,name,slug,sort_order,is_active').eq('is_active',true).order('sort_order').order('id').range(offset,offset+199);
        if(error)return [];
        if(!data.length)return rows;
        rows.push(...data);offset+=data.length;
      }
    },
    async relatedProducts(current){
      if(!window.ddvSupabase)return [];
      const items=[],seen=new Set([String(current.id)]);
      const add=rows=>(rows||[]).forEach(p=>{if(p.visibility==='visible'&&!p.deleted_at&&!seen.has(String(p.id))&&items.length<4){seen.add(String(p.id));items.push(p);}});
      const query=()=>ddvSupabase.from('product').select('*').eq('visibility','visible').is('deleted_at',null).neq('id',current.id).order('created_at',{ascending:false}).order('id');
      if(current.category_id!=null){
        const {data,error}=await query().eq('category_id',current.category_id).limit(4);
        if(!error)add(data);
      }
      if(items.length<4){
        const {data,error}=await query().limit(4+items.length);
        if(!error)add(data);
      }
      return items;
    },
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
      const rows=[];
      for(let offset=0;;){
        const pageSize=opts.limit?Math.min(200,opts.limit-rows.length):200;
        if(pageSize<=0)return rows;
        let q=window.ddvSupabase.from("product").select("*").eq("visibility","visible").is("deleted_at",null).order("created_at",{ascending:false}).order('id').range(offset,offset+pageSize-1);
        if(opts.featured)q=q.eq('is_featured',true);
        const {data,error}=await q;
        if(error)return [];
        if(!data.length)return rows;
        rows.push(...data);offset+=data.length;
      }
    },
    async product(id){
      if(!window.ddvSupabase) return null;
      const {data,error}=await window.ddvSupabase.from("product").select("*").eq("visibility","visible").is("deleted_at",null).eq("id",id).maybeSingle();
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
