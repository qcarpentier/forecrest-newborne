import React, { useState, useEffect } from "react";

const App = () => {
  const [page, setPage] = useState("dashboard");
  const [dashTab, setDashTab] = useState("overview");
  const [obStep, setObStep] = useState(1);
  const [tick, setTick] = useState(0);
  const [sideOpen, setSideOpen] = useState(true);
  const [dragId, setDragId] = useState(null);

  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 60); return () => clearInterval(id); }, []);

  const makeId = () => Math.random().toString(36).slice(2, 8);
  const [cats, setCats] = useState(() => [
    {id:"c70",pcmn:"70",title:"Chiffre d'affaires",type:"p",open:true,items:[{id:"a1",label:"Ventes de services",y1:85000,y2:140000,y3:210000},{id:"a2",label:"Ventes de marchandises",y1:42400,y2:60000,y3:80000}]},
    {id:"c74",pcmn:"74",title:"Autres produits",type:"p",open:false,items:[{id:"a3",label:"Subsides",y1:5000,y2:2000,y3:0}]},
    {id:"c60",pcmn:"60",title:"Appro. & marchandises",type:"c",open:true,items:[{id:"b1",label:"Achats matières premières",y1:22000,y2:32000,y3:42000},{id:"b2",label:"Sous-traitance",y1:12000,y2:18000,y3:24000}]},
    {id:"c61",pcmn:"61",title:"Services & biens divers",type:"c",open:true,items:[{id:"b3",label:"Loyer & charges",y1:9600,y2:9600,y3:12000},{id:"b4",label:"Assurances",y1:2400,y2:2600,y3:2800},{id:"b5",label:"Honoraires",y1:4800,y2:5200,y3:5500},{id:"b6",label:"Télécom & IT",y1:3600,y2:4000,y3:4200},{id:"b7",label:"Marketing",y1:6000,y2:8000,y3:10000}]},
    {id:"c62",pcmn:"62",title:"Rémunérations",type:"c",open:true,items:[{id:"b8",label:"Rémunération dirigeant",y1:24000,y2:36000,y3:42000},{id:"b9",label:"Cotisations sociales",y1:5400,y2:8100,y3:9450},{id:"b10",label:"Salaires employés",y1:0,y2:28000,y3:56000},{id:"b11",label:"Charges patronales",y1:0,y2:7500,y3:15000}]},
    {id:"c63",pcmn:"63",title:"Amortissements",type:"c",open:false,items:[{id:"b12",label:"Amort. matériel info",y1:3000,y2:3000,y3:3000},{id:"b13",label:"Amort. mobilier",y1:1200,y2:1200,y3:1200}]},
    {id:"c65",pcmn:"65",title:"Charges financières",type:"c",open:false,items:[{id:"b14",label:"Intérêts emprunt",y1:1200,y2:1000,y3:800},{id:"b15",label:"Frais bancaires",y1:300,y2:300,y3:300}]},
    {id:"c67",pcmn:"67",title:"Impôts",type:"c",open:false,items:[{id:"b16",label:"ISOC",y1:0,y2:5000,y3:12000}]},
  ]);

  /* ═══ TOKENS ═══ */
  const c = { bg:"#F5EFE6",card:"#FDFAF6",alt:"#F0E9DF",brd:"#E2DAD0",coral:"#D85A40",coralL:"#FCEEE9",orange:"#C07C2A",orangeL:"#FEF3E6",sun:"#F7C948",sunL:"#FEF8E1",teal:"#1E857A",tealL:"#E6F5F2",navy:"#264653",sky:"#7EC8C8",skyL:"#EAF7F7",ch:"#2A2A2A",st:"#5C5C5C",mi:"#908A80",red:"#C0392B" };
  const sh = "0 1px 3px rgba(31,61,71,.07),0 1px 2px rgba(31,61,71,.04)";
  const fmt = n => n.toLocaleString("fr-BE");

  /* ═══ STYLE HELPERS ═══ */
  const hs = (s,x={}) => ({fontFamily:"'Quicksand',sans-serif",fontSize:s,fontWeight:700,color:c.navy,margin:0,...x});
  const ts = (s,x={}) => ({fontFamily:"'DM Sans',sans-serif",fontSize:s,lineHeight:1.55,color:c.st,...x});
  const ann = (text,color=c.coral,size=15) => <span style={{fontFamily:"'Caveat',cursive",fontSize:size,color,fontWeight:600}}>{text}</span>;
  const pill = (text,bg,color) => <span style={{background:bg,color,fontFamily:"'DM Sans'",fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:14}}>{text}</span>;
  const counter = (to,dur=50,suf="",style={}) => { const p=Math.min(tick/dur,1); return <span style={style}>{Math.round(to*(1-Math.pow(1-p,3))).toLocaleString("fr-BE")}{suf}</span>; };
  const minibar = (val,max,color,h=7) => <div style={{background:c.bg,borderRadius:4,height:h,flex:1,border:`1px solid ${c.brd}`,overflow:"hidden"}}><div style={{width:`${(val/max)*100}%`,height:"100%",background:color,borderRadius:4,transition:"width .5s"}}/></div>;

  /* ═══ ICON ═══ */
  const I = ({n,s=20,col=c.navy}) => {
    const paths = {
      grid:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
      "chart-up":"M3 20 L9 13 L13 17 L21 4M17 4 L21 4 L21 8",
      layers:"M12 4 L22 9 L12 14 L2 9ZM2 13 L12 18 L22 13M2 17 L12 22 L22 17",
      wallet:"M2 6h20v14H2zM2 10h20",
      users:"M9 12a4 4 0 100-8 4 4 0 000 8zM1 20c0-4 4-6 8-6s8 2 8 6M17 9a3 3 0 100-6M19 14c2 .5 4 2.5 4 6",
      clipboard:"M4 4h16v18H4zM8 2h8v3H8z",
      shield:"M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6zM9 12l2 2 4-4",
      sparkle:"M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
      bolt:"M13 2L4 14h7v8l9-12h-7z",
      check:"M4 12l6 6L20 6",
      building:"M4 4h16v18H4zM10 22v-5h4v5",
      target:"M12 2a10 10 0 110 20 10 10 0 010-20zM12 6a6 6 0 110 12 6 6 0 010-12z",
      euro:"M12 2a10 10 0 110 20 10 10 0 010-20zM7 10.5h7M7 13.5h6",
      play:"M6 3l14 9-14 9z",
      settings:"M12 9a3 3 0 110 6 3 3 0 010-6zM19.4 15l.6.6a2 2 0 01-2.8 2.8l-.6-.6a2 2 0 00-3 1V21a2 2 0 01-4 0v-1a2 2 0 00-3-1l-.6.6a2 2 0 01-2.8-2.8l.6-.6a2 2 0 00-1-3H3a2 2 0 010-4h1a2 2 0 001-3l-.6-.6a2 2 0 012.8-2.8l.6.6a2 2 0 003-1V3a2 2 0 014 0v1a2 2 0 003 1l.6-.6a2 2 0 012.8 2.8l-.6.6a2 2 0 001 3h1a2 2 0 010 4h-1a2 2 0 00-1 3z",
    };
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={n==="check"?2.2:1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[n]||""}/>
      </svg>
    );
  };
  const ibox = (n,col,bg,s=18,bs=34,r=9) => <div style={{width:bs,height:bs,borderRadius:r,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n={n} s={s} col={col}/></div>;

  /* ═══ PLAN FINANCIER LOGIC ═══ */
  const sumC = (cat,y)=>cat.items.reduce((s,it)=>s+(it[y]||0),0);
  const totT = (t,y)=>cats.filter(x=>x.type===t).reduce((s,cat)=>s+sumC(cat,y),0);
  const pY=y=>totT("p",y), cY=y=>totT("c",y), rY=y=>pY(y)-cY(y);
  const yrs=["y1","y2","y3"], yrL=["An 1","An 2","An 3"];
  const toggleCat=id=>setCats(cs=>cs.map(x=>x.id===id?{...x,open:!x.open}:x));
  const addItem=id=>setCats(cs=>cs.map(x=>x.id===id?{...x,open:true,items:[...x.items,{id:makeId(),label:"Nouvel élément",y1:0,y2:0,y3:0}]}:x));
  const rmItem=(cid,iid)=>setCats(cs=>cs.map(x=>x.id===cid?{...x,items:x.items.filter(i=>i.id!==iid)}:x));
  const updItem=(cid,iid,f,v)=>setCats(cs=>cs.map(x=>x.id===cid?{...x,items:x.items.map(i=>i.id===iid?{...i,[f]:f==="label"?v:Number(v)||0}:i)}:x));
  const onDrop=tid=>{if(!dragId||dragId===tid)return;setCats(cs=>{const a=[...cs],fi=a.findIndex(x=>x.id===dragId),ti=a.findIndex(x=>x.id===tid);const[m]=a.splice(fi,1);a.splice(ti,0,m);return a;});setDragId(null);};

  /* ═══ ONBOARDING STEPS ═══ */
  const obSteps=[{id:1,l:"Société",i:"building",t:"Informations société",d:"Nom, forme juridique, date de création, BCE"},{id:2,l:"Activité",i:"target",t:"Votre activité",d:"Secteur, description, modèle de revenus"},{id:3,l:"Finances",i:"euro",t:"Situation financière",d:"Capital, apports, financements, trésorerie"},{id:4,l:"Prévisions",i:"chart-up",t:"Plan financier",d:"CA prévisionnel, charges, investissements"},{id:5,l:"Équipe",i:"users",t:"Fondateurs & équipe",d:"Cap table, vesting, rémunérations"},{id:6,l:"Validation",i:"shield",t:"Vérification",d:"Relecture, validation, export PDF"}];
  const obCur=obSteps.find(s=>s.id===obStep);

  const field=(label,placeholder,wide)=><div style={wide?{gridColumn:"1/-1"}:{}}><label style={ts(11,{fontWeight:500,display:"block",marginBottom:3})}>{label}</label><div style={{background:c.bg,border:`1px solid ${c.brd}`,borderRadius:8,padding:"9px 14px",fontFamily:"'DM Sans'",fontSize:13,color:c.mi}}>{placeholder}</div></div>;

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div style={{display:"flex",minHeight:"100vh",background:c.bg,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* ═══ SIDEBAR ═══ */}
      <div style={{width:sideOpen?200:60,background:c.card,borderRight:`1px solid ${c.brd}`,display:"flex",flexDirection:"column",padding:"14px 8px",transition:"width .2s",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",marginBottom:20,cursor:"pointer"}} onClick={()=>setSideOpen(!sideOpen)}>
          <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${c.coral},${c.orange})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'Quicksand'",fontSize:14,fontWeight:700,flexShrink:0}}>C</div>
          {sideOpen&&<span style={hs(13)}>Company</span>}
        </div>
        {[
          {id:"dashboard",icon:"grid",label:"Tableau de bord"},
          {id:"plan",icon:"clipboard",label:"Plan financier"},
          {id:"invest",icon:"building",label:"Mes investissements"},
          {id:"funding",icon:"shield",label:"Mes financements"},
          {id:"seuil",icon:"target",label:"Mon seuil"},
          {id:"salary",icon:"users",label:"Mon salaire"},
          {id:"monthly",icon:"chart-up",label:"Mois par mois"},
          {id:"fiscal",icon:"euro",label:"Mes impôts"},
          {id:"scenarios",icon:"layers",label:"Mes scénarios"},
          {id:"checklist",icon:"check",label:"Check-up notaire"},
          {id:"onboarding",icon:"play",label:"Onboarding"},
          {id:"settings",icon:"settings",label:"Paramètres"},
        ].map(it=>(
          <div key={it.id} onClick={()=>{setPage(it.id);setTick(0);}} style={{display:"flex",alignItems:"center",gap:10,padding:sideOpen?"9px 12px":"10px 0",justifyContent:sideOpen?"flex-start":"center",borderRadius:10,marginBottom:2,cursor:"pointer",transition:"all .15s",background:page===it.id?c.coralL:"transparent",border:page===it.id?`1px solid ${c.coral}40`:"1px solid transparent"}}>
            <I n={it.icon} s={18} col={page===it.id?c.coral:c.mi}/>
            {sideOpen&&<span style={ts(13,{fontWeight:page===it.id?600:400,color:page===it.id?c.coral:c.st})}>{it.label}</span>}
          </div>
        ))}
        <div style={{flex:1}}/>
        {sideOpen&&<div style={{padding:"12px 10px",background:c.tealL,borderRadius:10,marginTop:8}}><div style={ts(11,{color:c.teal,fontWeight:600})}>TechVenture SRL</div><div style={ts(10,{color:c.mi})}>BCE 0123.456.789</div></div>}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{flex:1,padding:"24px 28px",maxWidth:920,overflowY:"auto"}}>

        {/* ═══════════════════ DASHBOARD ═══════════════════ */}
        {page==="dashboard"&&<div>
          <h1 style={hs(22,{marginBottom:14})}>Dashboard</h1>
          {/* Tabs */}
          <div style={{display:"flex",gap:3,marginBottom:18,flexWrap:"wrap"}}>
            {[{id:"overview",l:"Vue globale",i:"grid"},{id:"pnl",l:"Résultat",i:"chart-up"},{id:"bilan",l:"Bilan",i:"layers"},{id:"treso",l:"Trésorerie",i:"wallet"},{id:"cap",l:"Cap Table",i:"users"}].map(t=>(
              <button key={t.id} onClick={()=>setDashTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,border:`1px solid ${dashTab===t.id?c.coral+"50":c.brd}`,borderRadius:8,padding:"6px 12px",fontFamily:"'DM Sans'",fontSize:11,fontWeight:dashTab===t.id?600:400,cursor:"pointer",background:dashTab===t.id?c.coralL:c.card,color:dashTab===t.id?c.coral:c.st}}>
                <I n={t.i} s={13} col={dashTab===t.id?c.coral:c.mi}/>{t.l}</button>
            ))}
          </div>

          {/* OVERVIEW */}
          {dashTab==="overview"&&<div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              {ibox("sparkle",c.teal,c.tealL)}<div><h2 style={hs(18)}>Bonjour, Sophie !</h2><p style={ts(12,{margin:0})}>Santé financière — 10 mars 2025</p></div>
            </div>
            <div style={{background:c.tealL,borderRadius:10,padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${c.teal}`,display:"flex",gap:8,alignItems:"flex-start"}}>
              {ibox("sparkle",c.teal,c.card,14,24,6)}
              <div><span style={ts(12,{color:c.teal,fontWeight:600})}>Vos 4 chiffres clés</span><br/><span style={ts(11)}>Le <strong style={{color:c.navy}}>CA</strong> = tout ce que vous vendez. Les <strong style={{color:c.navy}}>Charges</strong> = tout ce que vous dépensez. Le <strong style={{color:c.navy}}>Résultat</strong> = ce qui reste (CA − Charges). La <strong style={{color:c.navy}}>Trésorerie</strong> = l'argent disponible sur votre compte aujourd'hui.</span></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
              {[{l:"CA",v:127400,ch:"+18%",pos:true,i:"chart-up",bg:c.tealL,col:c.teal},{l:"Charges",v:89200,ch:"+6%",pos:false,i:"wallet",bg:c.coralL,col:c.coral},{l:"Résultat",v:38200,ch:"+42%",pos:true,i:"sparkle",bg:c.sunL,col:c.sun},{l:"Trésorerie",v:54600,ch:"+12k",pos:true,i:"shield",bg:c.skyL,col:c.sky}].map((k,i)=>(
                <div key={i} style={{background:c.card,borderRadius:14,padding:14,border:`1px solid ${c.brd}`,boxShadow:sh}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={ts(10)}>{k.l}</span>{ibox(k.i,k.col,k.bg,13,24,6)}</div>
                  {counter(k.v,45+i*8,"€",{fontFamily:"'Quicksand'",fontSize:20,fontWeight:700,color:c.navy,display:"block"})}
                  <span style={ts(10,{fontWeight:600,color:k.pos?c.teal:c.red})}>{k.ch}</span>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:12}}>
              <div style={{background:c.card,borderRadius:14,padding:20,border:`1px solid ${c.brd}`,boxShadow:sh}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><h3 style={hs(13)}>Revenus vs Charges</h3>{pill("12 mois",c.bg,c.st)}</div>
                <svg width="100%" height="100" viewBox="0 0 400 100" preserveAspectRatio="none">
                  {[40,44,38,52,48,56,60,55,62,68,72,80].map((h,i)=><rect key={`r${i}`} x={i*33+4} y={100-h*1.1} width={13} height={h*1.1} rx={3} fill={c.teal} opacity={.7}/>)}
                  {[32,35,30,38,36,40,42,39,44,46,48,52].map((h,i)=><rect key={`e${i}`} x={i*33+18} y={100-h*1.1} width={13} height={h*1.1} rx={3} fill={c.orange} opacity={.5}/>)}
                </svg>
              </div>
              <div style={{background:c.card,borderRadius:14,padding:20,border:`1px solid ${c.brd}`,boxShadow:sh}}>
                <h3 style={hs(13,{marginBottom:10})}>Score de santé</h3>
                <div style={{textAlign:"center",marginBottom:8}}>
                  <svg width="70" height="70" viewBox="0 0 70 70"><circle cx="35" cy="35" r="28" fill="none" stroke={c.bg} strokeWidth="6"/><circle cx="35" cy="35" r="28" fill="none" stroke={c.teal} strokeWidth="6" strokeDasharray={`${.78*176} ${176}`} strokeLinecap="round" transform="rotate(-90 35 35)"/></svg>
                  <div style={{marginTop:-48,fontFamily:"'Quicksand'",fontSize:20,fontWeight:700,color:c.teal}}>78</div><div style={{height:22}}/>
                </div>
                {[{l:"Rentabilité",v:85,col:c.teal},{l:"Liquidité",v:72,col:c.sky},{l:"Solvabilité",v:68,col:c.orange},{l:"Croissance",v:90,col:c.sun}].map(r=>(
                  <div key={r.l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={ts(10,{width:60,flexShrink:0})}>{r.l}</span>{minibar(r.v,100,r.col)}<span style={ts(10,{fontWeight:600,color:c.navy,width:20,textAlign:"right"})}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>}

          {/* P&L */}
          {dashTab==="pnl"&&<div>
            <div style={{background:c.tealL,borderRadius:10,padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${c.teal}`}}>
              <span style={ts(12,{color:c.teal,fontWeight:600})}>Le compte de résultat, c'est quoi ?</span><br/>
              <span style={ts(11)}>C'est le <strong style={{color:c.navy}}>film de votre année</strong> : combien vous avez gagné, combien vous avez dépensé, et ce qui reste à la fin. On part du chiffre d'affaires en haut, on enlève les dépenses une par une, et on arrive au bénéfice (ou à la perte) en bas.</span>
            </div>
            <div style={{background:c.card,borderRadius:14,border:`1px solid ${c.brd}`,boxShadow:sh,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${c.brd}`,display:"flex",justifyContent:"space-between"}}><h3 style={hs(14)}>Compte de résultat</h3>{pill("2024",c.bg,c.st)}</div>
            {[{l:"Chiffre d'affaires",v:127400,b:1,col:c.teal,ex:"Tout ce que vous avez vendu"},{l:"Coût marchandises",v:-48200,i:1,ex:"Ce que vous avez acheté pour vendre"},{l:"Marge brute",v:79200,b:1,col:c.teal,ex:"Ce qui reste après les achats"},{l:"Frais personnel",v:-22000,i:1,ex:"Salaires et cotisations"},{l:"Loyer",v:-8400,i:1,ex:"Bureau, local"},{l:"Services divers",v:-6200,i:1,ex:"Comptable, IT, assurances..."},{l:"Amortissements",v:-4400,i:1,ex:"Usure du matériel, étalée sur plusieurs années"},{l:"Résultat exploitation",v:38200,b:1,col:c.teal,ex:"Ce que génère votre activité"},{l:"Charges financières",v:-1600,i:1,ex:"Intérêts de vos emprunts"},{l:"Résultat avant impôts",v:36600,b:1,col:c.navy,ex:"Avant de payer l'État"},{l:"Impôts (~25%)",v:-9150,i:1,ex:"Impôt des sociétés belge"},{l:"Résultat net",v:27450,b:1,col:c.teal,big:1,ex:"Votre bénéfice final !"}].map((ln,idx)=>(
              <div key={idx} style={{display:"flex",alignItems:"center",padding:`${ln.big?12:7}px 16px`,paddingLeft:16+(ln.i||0)*18,background:ln.big?c.tealL:ln.b?c.bg:idx%2===0?c.card:c.alt,borderBottom:`1px solid ${c.brd}30`}}>
                <span style={ts(ln.b?12:11,{fontWeight:ln.b?600:400,color:ln.b?c.navy:c.st,flex:1})}>{ln.i?<span style={{color:c.mi,marginRight:5}}>└</span>:null}{ln.l}</span>
                {ln.ex&&<span style={{...ts(9),background:c.orangeL,color:c.orange,padding:"2px 7px",borderRadius:8,marginRight:8}}>{ln.ex}</span>}
                <span style={{fontFamily:"'Quicksand'",fontSize:ln.big?16:12,fontWeight:ln.b?700:500,color:ln.v>=0?(ln.col||c.teal):c.coral,minWidth:80,textAlign:"right"}}>{ln.v>=0?"":"−"}{fmt(Math.abs(ln.v))}€</span>
              </div>
            ))}
          </div></div>}

          {/* BILAN */}
          {dashTab==="bilan"&&<div>
            <div style={{background:c.orangeL,borderRadius:10,padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${c.orange}`}}>
              <span style={ts(12,{color:c.orange,fontWeight:600})}>Le bilan, c'est quoi ?</span><br/>
              <span style={ts(11)}>C'est une <strong style={{color:c.navy}}>photo de votre patrimoine</strong> à un instant T. À gauche : tout ce que votre société <strong style={{color:c.navy}}>possède</strong> (machines, stocks, argent en banque). À droite : comment tout ça a été <strong style={{color:c.navy}}>financé</strong> (votre apport, vos bénéfices, vos dettes). Les deux côtés sont toujours égaux.</span>
            </div>
            <div style={{background:c.card,borderRadius:14,padding:20,border:`1px solid ${c.brd}`,boxShadow:sh}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
                {[{title:"ACTIF",items:[{l:"Immobilisations",v:40000,col:c.navy},{l:"Stocks",v:12000,col:c.orange},{l:"Créances",v:18500,col:c.orange},{l:"Trésorerie",v:54600,col:c.teal}],col:c.teal},{title:"PASSIF",items:[{l:"Capital & réserves",v:67100,col:c.navy},{l:"Résultat",v:27450,col:c.teal},{l:"Dettes fourn.",v:14550,col:c.coral},{l:"Emprunt",v:16000,col:c.coral}],col:c.coral}].map((side,si)=>{
                  const tot=side.items.reduce((s,a)=>s+a.v,0),mx=67100;
                  return <div key={si}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><div style={{width:3,height:14,borderRadius:2,background:side.col}}/><h4 style={hs(12)}>{side.title}</h4></div>
                    {side.items.map((it,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={ts(11,{flex:1})}>{it.l}</span>{minibar(it.v,mx,it.col,5)}<span style={{fontFamily:"'Quicksand'",fontSize:12,fontWeight:600,color:c.navy,minWidth:55,textAlign:"right"}}>{fmt(it.v)}€</span></div>)}
                    <div style={{borderTop:`2px solid ${side.col}`,paddingTop:6,display:"flex",justifyContent:"space-between"}}><span style={ts(12,{fontWeight:600})}>Total</span><span style={{fontFamily:"'Quicksand'",fontSize:14,fontWeight:700,color:side.col}}>{fmt(tot)}€</span></div>
                  </div>;
                })}
              </div>
            </div>
          </div>}

          {/* TRESORERIE */}
          {dashTab==="treso"&&<div>
            <div style={{background:c.tealL,borderRadius:10,padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${c.teal}`}}>
              <span style={ts(12,{color:c.teal,fontWeight:600})}>La trésorerie, c'est quoi ?</span><br/>
              <span style={ts(11)}>C'est <strong style={{color:c.navy}}>l'argent réellement disponible</strong> sur vos comptes. Une entreprise peut être rentable sur papier mais couler si elle n'a plus de cash pour payer ses factures. Le <strong style={{color:c.navy}}>runway</strong> = combien de mois vous pouvez tenir avec votre trésorerie actuelle.</span>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>{pill("Solde : 54 600€",c.tealL,c.teal)}{pill("Runway : 8.5 mois",c.bg,c.st)}</div>
            <div style={{background:c.card,borderRadius:14,padding:20,border:`1px solid ${c.brd}`,boxShadow:sh}}>
              <svg width="100%" height="110" viewBox="0 0 480 110" preserveAspectRatio="none">
                {[8200,9100,10300,11200,10800,12400,11500,12800,13600,14200,15100,16800].map((v,i)=>
                  <rect key={"in"+i} x={i*40+4} y={110-(v/16800)*90} width={16} height={(v/16800)*90} rx={3} fill={c.teal} opacity={.7}/>
                )}
                {[7100,7400,7800,8200,8500,8900,9200,9500,9800,10200,10500,11100].map((v,i)=>
                  <rect key={"out"+i} x={i*40+21} y={110-(v/16800)*90} width={16} height={(v/16800)*90} rx={3} fill={c.coral} opacity={.5}/>
                )}
              </svg>
            </div>
          </div>}

          {/* CAP TABLE */}
          {dashTab==="cap"&&<div>
            <div style={{background:c.sunL,borderRadius:10,padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${c.sun}`}}>
              <span style={ts(12,{color:c.orange,fontWeight:600})}>La Cap Table, c'est quoi ?</span><br/>
              <span style={ts(11)}>C'est le <strong style={{color:c.navy}}>tableau de répartition</strong> de votre société : qui détient combien de parts et donc combien de pouvoir de décision. Le <strong style={{color:c.navy}}>vesting</strong> = les parts sont acquises progressivement (ex: sur 4 ans), pour s'assurer que chaque fondateur reste impliqué.</span>
            </div>
            <div style={{background:c.card,borderRadius:14,padding:20,border:`1px solid ${c.brd}`,boxShadow:sh}}>
              <div style={{display:"grid",gridTemplateColumns:"100px 1fr",gap:20,alignItems:"center"}}>
                <svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="36" fill="none" stroke={c.coral} strokeWidth="12" strokeDasharray={`${.6*226} ${226}`} transform="rotate(-90 45 45)"/><circle cx="45" cy="45" r="36" fill="none" stroke={c.teal} strokeWidth="12" strokeDasharray={`${.3*226} ${226}`} strokeDashoffset={`${-.6*226}`} transform="rotate(-90 45 45)"/><circle cx="45" cy="45" r="36" fill="none" stroke={c.sun} strokeWidth="12" strokeDasharray={`${.1*226} ${226}`} strokeDashoffset={`${-.9*226}`} transform="rotate(-90 45 45)"/><circle cx="45" cy="45" r="29" fill={c.card}/><text x="45" y="48" textAnchor="middle" style={{fontFamily:"'Quicksand'",fontSize:11,fontWeight:700,fill:c.navy}}>25k€</text></svg>
                <div>{[{n:"Sophie Dupont",r:"CEO",pct:60,col:c.coral},{n:"Marc Janssen",r:"CTO",pct:30,col:c.teal},{n:"Pool ESOP",r:"Options",pct:10,col:c.sun}].map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:8,background:i%2?c.card:c.bg,borderRadius:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:p.col}}/><div style={{flex:1}}><div style={ts(12,{fontWeight:600,color:c.navy})}>{p.n}</div><div style={ts(10)}>{p.r}</div></div>
                    <span style={{fontFamily:"'Quicksand'",fontSize:16,fontWeight:700,color:p.col}}>{p.pct}%</span>
                  </div>
                ))}</div>
              </div>
            </div>
          </div>}
        </div>}

        {/* ═══════════════════ PLAN FINANCIER ═══════════════════ */}
        {page==="plan"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Plan Financier</h1>
          <p style={ts(12,{marginBottom:10})}>Votre projection financière sur 3 ans, organisée selon le plan comptable belge (PCMN).</p>
          <div style={{background:c.orangeL,borderRadius:10,padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${c.orange}`}}>
            <span style={ts(12,{color:c.orange,fontWeight:600})}>Le plan financier, c'est quoi ?</span><br/>
            <span style={ts(11)}>C'est votre <strong style={{color:c.navy}}>budget prévisionnel</strong> : combien vous pensez gagner et dépenser. En Belgique, il est <strong style={{color:c.navy}}>obligatoire pour créer une SRL</strong> (art. 5:4 CSA). Il prouve que votre projet est viable.</span>
          </div>

          {/* Column headers */}
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px 4px 40px",marginBottom:4}}>
            <span style={ts(10,{flex:1,fontWeight:600,color:c.navy,textTransform:"uppercase",letterSpacing:1})}>Poste</span>
            <span style={ts(10,{fontWeight:600,color:c.navy,width:78,textAlign:"right"})}>An 1</span>
            <span style={ts(10,{fontWeight:600,color:c.navy,width:78,textAlign:"right"})}>An 2</span>
            <span style={ts(10,{fontWeight:600,color:c.navy,width:78,textAlign:"right"})}>An 3</span>
            <span style={{width:28}}/>
          </div>

          {/* PRODUITS header */}
          <div style={{display:"flex",alignItems:"center",gap:6,margin:"8px 0 4px"}}>
            <div style={{width:3,height:14,borderRadius:2,background:c.teal}}/>
            <h2 style={hs(13)}>Produits (Cl. 7)</h2>
            {ann("Ce que vous gagnez",c.teal,12)}
          </div>

          {/* Categories */}
          {cats.map(cat => {
            if (cat.type !== "p") return null;
            const accent = c.teal;
            const bgH = c.tealL;
            return (
              <div key={cat.id} style={{background:c.card,borderRadius:12,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:8,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:bgH,borderBottom:"1px solid "+c.brd,cursor:"pointer"}} onClick={()=>toggleCat(cat.id)}>
                  <span style={{fontSize:10,color:accent,fontWeight:700,transform:cat.open?"rotate(0)":"rotate(-90deg)",transition:"transform .2s",display:"inline-block"}}>▼</span>
                  {pill("CL."+cat.pcmn,accent,"#fff")}
                  <span style={hs(12,{flex:1})}>{cat.title}</span>
                  <span style={{fontFamily:"'Quicksand'",fontSize:12,fontWeight:700,color:accent,width:78,textAlign:"right"}}>{fmt(sumC(cat,"y1"))}€</span>
                  <span style={{fontFamily:"'Quicksand'",fontSize:12,fontWeight:700,color:accent,width:78,textAlign:"right"}}>{fmt(sumC(cat,"y2"))}€</span>
                  <span style={{fontFamily:"'Quicksand'",fontSize:12,fontWeight:700,color:accent,width:78,textAlign:"right"}}>{fmt(sumC(cat,"y3"))}€</span>
                  <button onClick={e=>{e.stopPropagation();addItem(cat.id);}} style={{background:"none",border:"none",cursor:"pointer",color:accent,fontSize:14,padding:"2px 6px"}}>＋</button>
                </div>
                {cat.open && cat.items.map((it,idx) => (
                  <div key={it.id} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px 5px 40px",background:idx%2===1?c.alt:c.card,borderBottom:"1px solid "+c.brd+"30"}}>
                    <input value={it.label} onChange={e=>updItem(cat.id,it.id,"label",e.target.value)} style={{flex:1,border:"none",background:"transparent",fontFamily:"'DM Sans'",fontSize:12,color:c.ch,outline:"none",padding:"3px 0"}}/>
                    <input type="number" value={it.y1} onChange={e=>updItem(cat.id,it.id,"y1",e.target.value)} style={{width:72,textAlign:"right",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",fontFamily:"'DM Sans'",fontSize:12,color:c.navy,background:"transparent",outline:"none"}}/>
                    <input type="number" value={it.y2} onChange={e=>updItem(cat.id,it.id,"y2",e.target.value)} style={{width:72,textAlign:"right",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",fontFamily:"'DM Sans'",fontSize:12,color:c.navy,background:"transparent",outline:"none"}}/>
                    <input type="number" value={it.y3} onChange={e=>updItem(cat.id,it.id,"y3",e.target.value)} style={{width:72,textAlign:"right",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",fontFamily:"'DM Sans'",fontSize:12,color:c.navy,background:"transparent",outline:"none"}}/>
                    <button onClick={()=>rmItem(cat.id,it.id)} style={{background:"none",border:"none",cursor:"pointer",color:c.mi,fontSize:12,padding:"2px"}}>✕</button>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Total Produits */}
          <div style={{display:"flex",alignItems:"center",padding:"8px 12px 8px 40px",background:c.tealL,borderRadius:8,border:"1px solid "+c.teal+"30",marginBottom:16}}>
            <span style={hs(12,{flex:1,color:c.teal})}>Total Produits</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:13,fontWeight:700,color:c.teal,width:78,textAlign:"right"}}>{fmt(pY("y1"))}€</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:13,fontWeight:700,color:c.teal,width:78,textAlign:"right"}}>{fmt(pY("y2"))}€</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:13,fontWeight:700,color:c.teal,width:78,textAlign:"right"}}>{fmt(pY("y3"))}€</span>
            <span style={{width:28}}/>
          </div>

          {/* CHARGES header */}
          <div style={{display:"flex",alignItems:"center",gap:6,margin:"8px 0 4px"}}>
            <div style={{width:3,height:14,borderRadius:2,background:c.coral}}/>
            <h2 style={hs(13)}>Charges (Cl. 6)</h2>
            {ann("Ce que vous dépensez",c.coral,12)}
          </div>

          {cats.map(cat => {
            if (cat.type !== "c") return null;
            const accent = c.coral;
            const bgH = c.coralL;
            return (
              <div key={cat.id} style={{background:c.card,borderRadius:12,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:8,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:bgH,borderBottom:"1px solid "+c.brd,cursor:"pointer"}} onClick={()=>toggleCat(cat.id)}>
                  <span style={{fontSize:10,color:accent,fontWeight:700,transform:cat.open?"rotate(0)":"rotate(-90deg)",transition:"transform .2s",display:"inline-block"}}>▼</span>
                  {pill("CL."+cat.pcmn,accent,"#fff")}
                  <span style={hs(12,{flex:1})}>{cat.title}</span>
                  <span style={{fontFamily:"'Quicksand'",fontSize:12,fontWeight:700,color:c.navy,width:78,textAlign:"right"}}>{fmt(sumC(cat,"y1"))}€</span>
                  <span style={{fontFamily:"'Quicksand'",fontSize:12,fontWeight:700,color:c.navy,width:78,textAlign:"right"}}>{fmt(sumC(cat,"y2"))}€</span>
                  <span style={{fontFamily:"'Quicksand'",fontSize:12,fontWeight:700,color:c.navy,width:78,textAlign:"right"}}>{fmt(sumC(cat,"y3"))}€</span>
                  <button onClick={e=>{e.stopPropagation();addItem(cat.id);}} style={{background:"none",border:"none",cursor:"pointer",color:accent,fontSize:14,padding:"2px 6px"}}>＋</button>
                </div>
                {cat.open && cat.items.map((it,idx) => (
                  <div key={it.id} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px 5px 40px",background:idx%2===1?c.alt:c.card,borderBottom:"1px solid "+c.brd+"30"}}>
                    <input value={it.label} onChange={e=>updItem(cat.id,it.id,"label",e.target.value)} style={{flex:1,border:"none",background:"transparent",fontFamily:"'DM Sans'",fontSize:12,color:c.ch,outline:"none",padding:"3px 0"}}/>
                    <input type="number" value={it.y1} onChange={e=>updItem(cat.id,it.id,"y1",e.target.value)} style={{width:72,textAlign:"right",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",fontFamily:"'DM Sans'",fontSize:12,color:c.navy,background:"transparent",outline:"none"}}/>
                    <input type="number" value={it.y2} onChange={e=>updItem(cat.id,it.id,"y2",e.target.value)} style={{width:72,textAlign:"right",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",fontFamily:"'DM Sans'",fontSize:12,color:c.navy,background:"transparent",outline:"none"}}/>
                    <input type="number" value={it.y3} onChange={e=>updItem(cat.id,it.id,"y3",e.target.value)} style={{width:72,textAlign:"right",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",fontFamily:"'DM Sans'",fontSize:12,color:c.navy,background:"transparent",outline:"none"}}/>
                    <button onClick={()=>rmItem(cat.id,it.id)} style={{background:"none",border:"none",cursor:"pointer",color:c.mi,fontSize:12,padding:"2px"}}>✕</button>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Total Charges */}
          <div style={{display:"flex",alignItems:"center",padding:"8px 12px 8px 40px",background:c.coralL,borderRadius:8,border:"1px solid "+c.coral+"30",marginBottom:16}}>
            <span style={hs(12,{flex:1,color:c.coral})}>Total Charges</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:13,fontWeight:700,color:c.coral,width:78,textAlign:"right"}}>{fmt(cY("y1"))}€</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:13,fontWeight:700,color:c.coral,width:78,textAlign:"right"}}>{fmt(cY("y2"))}€</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:13,fontWeight:700,color:c.coral,width:78,textAlign:"right"}}>{fmt(cY("y3"))}€</span>
            <span style={{width:28}}/>
          </div>

          {/* Résultat */}
          <div style={{display:"flex",alignItems:"center",padding:"12px 12px 12px 40px",background:c.card,borderRadius:12,border:"2px solid "+c.navy,boxShadow:sh,marginBottom:20}}>
            <span style={hs(14,{flex:1})}>Résultat de l'exercice</span>
            {["y1","y2","y3"].map(y => {
              const r = rY(y);
              return <span key={y} style={{fontFamily:"'Quicksand'",fontSize:16,fontWeight:700,color:r>=0?c.teal:c.red,width:78,textAlign:"right"}}>{r>=0?"+":"−"}{fmt(Math.abs(r))}€</span>;
            })}
            <span style={{width:28}}/>
          </div>

          {/* Chart */}
          <div style={{background:c.card,borderRadius:14,padding:20,border:"1px solid "+c.brd,boxShadow:sh}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <h3 style={hs(13)}>Projection visuelle</h3>
              {ann("Calcul automatique",c.orange,12)}
            </div>
            <div style={{display:"flex",gap:16,alignItems:"flex-end",height:120}}>
              {["y1","y2","y3"].map((y,yi) => {
                const p = pY(y);
                const ch = cY(y);
                const r = rY(y);
                const mx = Math.max(pY("y1"),pY("y2"),pY("y3"));
                return (
                  <div key={y} style={{flex:1,textAlign:"center"}}>
                    <div style={ts(10,{fontWeight:600,color:r>=0?c.teal:c.red,marginBottom:4})}>{r>=0?"+":"−"}{fmt(Math.abs(r))}€</div>
                    <div style={{display:"flex",gap:3,alignItems:"flex-end",height:85,justifyContent:"center"}}>
                      <div style={{width:22,background:c.teal,borderRadius:"5px 5px 0 0",height:(p/mx)*100+"%",opacity:.8}}/>
                      <div style={{width:22,background:c.coral,borderRadius:"5px 5px 0 0",height:(ch/mx)*100+"%",opacity:.6}}/>
                    </div>
                    <div style={ts(11,{fontWeight:600,color:c.navy,marginTop:6})}>{["An 1","An 2","An 3"][yi]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>}

        {/* ═══════════════════ ONBOARDING ═══════════════════ */}
        {page==="onboarding"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Onboarding</h1>
          <p style={ts(12,{marginBottom:14})}>L'accompagnateur guide le porteur de projet.</p>
          <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:14}}>
            <div style={{background:c.card,borderRadius:14,padding:12,border:`1px solid ${c.brd}`,boxShadow:sh}}>
              {obSteps.map((s,i)=>{const done=s.id<obStep,active=s.id===obStep;return(
                <div key={s.id} onClick={()=>setObStep(s.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 8px",borderRadius:10,marginBottom:2,cursor:"pointer",background:active?c.coralL:"transparent",border:active?`1.5px solid ${c.coral}`:"1.5px solid transparent",transition:"all .15s"}}>
                  <div style={{width:28,height:28,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:done?c.teal:active?c.coral:c.bg,border:done||active?"none":`1px solid ${c.brd}`}}>
                    {done?<I n="check" s={13} col="#fff"/>:<I n={s.i} s={13} col={active?"#fff":c.mi}/>}
                  </div>
                  <div><div style={ts(11,{fontWeight:active?600:400,color:s.id>obStep?c.mi:c.navy})}>{s.l}</div>{active&&<div style={ts(9,{color:c.coral})}>En cours</div>}</div>
                </div>
              );})}
            </div>
            <div style={{background:c.card,borderRadius:14,padding:24,border:`1px solid ${c.brd}`,boxShadow:sh}}>
              {ann(`Étape ${obStep}/6`,c.mi,12)}
              <h3 style={hs(18,{margin:"4px 0"})}>{obCur.t}</h3>
              <p style={ts(12,{marginBottom:18})}>{obCur.d}</p>
              {obStep===1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{field("Nom","TechVenture SRL")}{field("Forme juridique","SRL ▾")}{field("Date de création","JJ/MM/AAAA")}{field("Numéro BCE","0XXX.XXX.XXX")}</div>}
              {obStep===2&&<div style={{display:"grid",gap:12}}>{field("Secteur","Tech / SaaS...")}{field("Description","Décrivez...",true)}{field("Modèle","Abonnement / Vente...")}</div>}
              {obStep===3&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{field("Capital","25 000 €")}{field("Apports","10 000 €")}{field("Financements","Prêt, subsides...")}{field("Trésorerie","15 000 €")}</div>}
              {obStep===4&&<div style={{display:"grid",gap:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{field("An 1 — CA","€")}{field("An 2 — CA","€")}{field("An 3 — CA","€")}</div><div style={{padding:10,background:c.tealL,borderRadius:8,borderLeft:`3px solid ${c.teal}`}}>{ann("💡 Estimez au mieux, on affinera ensemble.",c.teal,13)}</div></div>}
              {obStep===5&&<div style={{display:"grid",gap:12}}>{field("Fondateurs","2")}{field("Répartition","60% / 40%",true)}{ann("→ Cap table détaillée après l'onboarding",c.orange,12)}</div>}
              {obStep===6&&<div style={{textAlign:"center",padding:16}}>{ibox("shield",c.teal,c.tealL,28,52,14)}<h4 style={hs(16,{margin:"12px 0 6px"})}>Prêt pour validation</h4><p style={ts(13,{maxWidth:340,margin:"0 auto 10px"})}>Le comptable peut valider et exporter.</p>{ann("↑ Export PDF normalisé belge",c.coral)}</div>}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:22,paddingTop:12,borderTop:`1px solid ${c.brd}`}}>
                <button disabled={obStep===1} onClick={()=>setObStep(s=>Math.max(1,s-1))} style={{background:obStep===1?c.bg:c.card,border:`1px solid ${obStep===1?"transparent":c.brd}`,borderRadius:8,padding:"8px 18px",fontFamily:"'DM Sans'",fontSize:12,fontWeight:600,color:obStep===1?c.mi:c.st,cursor:obStep===1?"not-allowed":"pointer"}}>← Précédent</button>
                <button onClick={()=>setObStep(s=>Math.min(6,s+1))} style={{background:obStep===6?c.teal:c.coral,border:"none",borderRadius:8,padding:"8px 20px",fontFamily:"'DM Sans'",fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer"}}>{obStep===6?"Valider ✓":"Suivant →"}</button>
              </div>
            </div>
          </div>
        </div>}

        {/* ═══════════════════ MES INVESTISSEMENTS ═══════════════════ */}
        {page==="invest"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Mes investissements</h1>
          <p style={ts(12,{marginBottom:10})}>Tout ce que vous achetez pour faire tourner votre activité.</p>
          <div style={{background:c.tealL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.teal}}>
            <span style={ts(12,{color:c.teal,fontWeight:600})}>C'est quoi un investissement ?</span><br/>
            <span style={ts(11)}>C'est un achat <strong style={{color:c.navy}}>durable</strong> (ordi, véhicule, mobilier, logiciel...). Contrairement à une dépense courante, son coût est <strong style={{color:c.navy}}>réparti sur plusieurs années</strong> dans vos comptes — c'est ce qu'on appelle l'amortissement.</span>
          </div>
          {[
            {name:"MacBook Pro 16\"",cat:"Matériel informatique",cost:3200,dur:3,year:2025,pct:33},
            {name:"Mobilier de bureau",cat:"Mobilier",cost:2400,dur:5,year:2025,pct:20},
            {name:"Véhicule utilitaire",cat:"Véhicules",cost:18000,dur:5,year:2025,pct:20},
            {name:"Licence logicielle (SaaS)",cat:"Immo. incorporelle",cost:4800,dur:3,year:2025,pct:33},
          ].map((inv,i) => (
            <div key={i} style={{background:c.card,borderRadius:12,padding:16,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={hs(14)}>{inv.name}</div>
                  <div style={ts(11)}>{inv.cat} · Acheté en {inv.year}</div>
                </div>
                <span style={{fontFamily:"'Quicksand'",fontSize:18,fontWeight:700,color:c.navy}}>{fmt(inv.cost)}€</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={ts(10,{width:120})}>Amorti sur {inv.dur} ans ({inv.pct}%/an)</span>
                <div style={{flex:1,background:c.bg,borderRadius:4,height:6,border:"1px solid "+c.brd,overflow:"hidden"}}>
                  <div style={{width:inv.pct+"%",height:"100%",background:c.teal,borderRadius:4}}/>
                </div>
                <span style={ts(10,{fontWeight:600,color:c.teal})}>{fmt(Math.round(inv.cost/inv.dur))}€/an</span>
              </div>
            </div>
          ))}
          <div style={{background:c.card,borderRadius:12,padding:14,border:"1px solid "+c.brd,boxShadow:sh,display:"flex",justifyContent:"space-between"}}>
            <span style={hs(13)}>Total investissements</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:16,fontWeight:700,color:c.navy}}>28 400€</span>
          </div>
        </div>}

        {/* ═══════════════════ MES FINANCEMENTS ═══════════════════ */}
        {page==="funding"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Mes financements</h1>
          <p style={ts(12,{marginBottom:10})}>D'où vient l'argent pour lancer et faire grandir votre société ?</p>
          <div style={{background:c.orangeL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.orange}}>
            <span style={ts(12,{color:c.orange,fontWeight:600})}>Les 3 sources d'argent</span><br/>
            <span style={ts(11)}><strong style={{color:c.navy}}>Vos apports</strong> = l'argent que vous mettez vous-même. <strong style={{color:c.navy}}>Les prêts</strong> = l'argent emprunté (à rembourser). <strong style={{color:c.navy}}>Les subsides</strong> = des aides publiques (pas à rembourser !).</span>
          </div>
          {[
            {type:"Apport personnel",who:"Sophie Dupont",amount:15000,color:c.teal,icon:"✓",note:"Versé sur le compte de la société"},
            {type:"Apport personnel",who:"Marc Janssen",amount:10000,color:c.teal,icon:"✓",note:"Versé sur le compte de la société"},
            {type:"Prêt bancaire",who:"Belfius",amount:30000,color:c.orange,icon:"↻",note:"Taux 4.2% · 60 mois · 553€/mois"},
            {type:"Subside régional",who:"Région wallonne",amount:8000,color:c.sun,icon:"★",note:"Prime à l'investissement · Reçu"},
          ].map((f,i) => (
            <div key={i} style={{background:c.card,borderRadius:12,padding:16,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:10,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:36,height:36,borderRadius:10,background:f.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{f.icon}</div>
              <div style={{flex:1}}>
                <div style={hs(13)}>{f.type}</div>
                <div style={ts(11)}>{f.who} · {f.note}</div>
              </div>
              <span style={{fontFamily:"'Quicksand'",fontSize:16,fontWeight:700,color:f.color}}>{fmt(f.amount)}€</span>
            </div>
          ))}
          <div style={{background:c.card,borderRadius:12,padding:14,border:"1px solid "+c.brd,boxShadow:sh,display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <span style={hs(13)}>Total financements</span>
            <span style={{fontFamily:"'Quicksand'",fontSize:16,fontWeight:700,color:c.navy}}>63 000€</span>
          </div>
          <div style={{background:c.tealL,borderRadius:10,padding:10,borderLeft:"3px solid "+c.teal}}>
            {ann("💡 Règle d'or : essayez d'avoir au moins 30% d'apports propres par rapport au total. Ici vous êtes à 40% — c'est bien !",c.teal,13)}
          </div>
        </div>}

        {/* ═══════════════════ MON SEUIL DE RENTABILITÉ ═══════════════════ */}
        {page==="seuil"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Mon seuil de rentabilité</h1>
          <p style={ts(12,{marginBottom:10})}>À partir de combien de ventes votre société commence à gagner de l'argent ?</p>
          <div style={{background:c.coralL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.coral}}>
            <span style={ts(12,{color:c.coral,fontWeight:600})}>Le seuil de rentabilité, c'est quoi ?</span><br/>
            <span style={ts(11)}>C'est le <strong style={{color:c.navy}}>montant minimum de ventes</strong> qu'il vous faut pour couvrir toutes vos dépenses. En dessous, vous perdez de l'argent. Au-dessus, vous en gagnez. C'est votre "point zéro".</span>
          </div>
          <div style={{background:c.card,borderRadius:14,padding:24,border:"1px solid "+c.brd,boxShadow:sh,textAlign:"center",marginBottom:16}}>
            <div style={ts(12,{marginBottom:4})}>Votre seuil est de</div>
            <div style={{fontFamily:"'Quicksand'",fontSize:36,fontWeight:700,color:c.coral}}>7 150€<span style={ts(14)}> / mois</span></div>
            <div style={{fontFamily:"'Quicksand'",fontSize:20,fontWeight:700,color:c.navy,marginTop:4}}>soit 85 800€ / an</div>
            <div style={{marginTop:16,background:c.bg,borderRadius:10,padding:12,display:"inline-block"}}>
              {ann("→ Vous vendez en moyenne 10 616€/mois — vous êtes au-dessus !",c.teal,15)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:c.card,borderRadius:12,padding:16,border:"1px solid "+c.brd,boxShadow:sh}}>
              <div style={ts(11,{marginBottom:4})}>Charges fixes par mois</div>
              <div style={{fontFamily:"'Quicksand'",fontSize:20,fontWeight:700,color:c.coral}}>4 550€</div>
              <div style={ts(10,{marginTop:6})}>Loyer, assurances, salaires fixes, abonnements... Ce que vous payez même si vous ne vendez rien.</div>
            </div>
            <div style={{background:c.card,borderRadius:12,padding:16,border:"1px solid "+c.brd,boxShadow:sh}}>
              <div style={ts(11,{marginBottom:4})}>Marge sur chaque vente</div>
              <div style={{fontFamily:"'Quicksand'",fontSize:20,fontWeight:700,color:c.teal}}>63.6%</div>
              <div style={ts(10,{marginTop:6})}>Sur chaque euro vendu, il vous reste 0,64€ après les coûts directs (achats, sous-traitance).</div>
            </div>
          </div>
          <div style={{background:c.card,borderRadius:14,padding:20,border:"1px solid "+c.brd,boxShadow:sh}}>
            <h3 style={hs(13,{marginBottom:10})}>Votre zone de rentabilité</h3>
            <svg width="100%" height="100" viewBox="0 0 400 100">
              <line x1="0" y1="80" x2="400" y2="80" stroke={c.brd} strokeWidth="1"/>
              <line x1="0" y1="50" x2="400" y2="50" stroke={c.brd} strokeWidth="1" strokeDasharray="4 4"/>
              <rect x="0" y="50" width="400" height="30" fill={c.coral} opacity="0.06" rx="4"/>
              <rect x="0" y="10" width="400" height="40" fill={c.teal} opacity="0.06" rx="4"/>
              <line x1="220" y1="5" x2="220" y2="95" stroke={c.coral} strokeWidth="2" strokeDasharray="4 3"/>
              <text x="226" y="16" style={{fontFamily:"'DM Sans'",fontSize:8,fill:c.coral}}>Seuil : 7 150€</text>
              <path d="M20 75 L100 60 L180 52 L260 40 L340 25 L380 18" stroke={c.teal} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <text x="10" y="96" style={{fontFamily:"'DM Sans'",fontSize:7,fill:c.mi}}>Jan</text>
              <text x="360" y="96" style={{fontFamily:"'DM Sans'",fontSize:7,fill:c.mi}}>Déc</text>
            </svg>
            <div style={{display:"flex",gap:14,marginTop:6}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:3,background:c.coral,opacity:.15}}/><span style={ts(10)}>Zone de perte</span></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:3,background:c.teal,opacity:.15}}/><span style={ts(10)}>Zone de profit</span></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:3,background:c.teal,borderRadius:2}}/><span style={ts(10)}>Vos ventes réelles</span></div>
            </div>
          </div>
        </div>}

        {/* ═══════════════════ SIMULATEUR DE SALAIRE ═══════════════════ */}
        {page==="salary"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Mon salaire de dirigeant</h1>
          <p style={ts(12,{marginBottom:10})}>Combien pouvez-vous vous verser chaque mois en tant que gérant de votre SRL ?</p>
          <div style={{background:c.sunL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.sun}}>
            <span style={ts(12,{color:c.orange,fontWeight:600})}>Comment ça marche ?</span><br/>
            <span style={ts(11)}>En SRL, vous vous versez une <strong style={{color:c.navy}}>rémunération de dirigeant</strong>. La société paie des <strong style={{color:c.navy}}>cotisations sociales</strong> (~20,5%) dessus, et vous payez ensuite de l'<strong style={{color:c.navy}}>impôt des personnes physiques</strong> sur ce que vous recevez. Plus vous vous versez, plus vous payez d'impôt — il faut trouver le bon équilibre.</span>
          </div>
          <div style={{background:c.card,borderRadius:14,padding:24,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:16}}>
            <div style={ts(12,{marginBottom:8})}>Rémunération annuelle brute choisie</div>
            <div style={{fontFamily:"'Quicksand'",fontSize:32,fontWeight:700,color:c.navy,marginBottom:16}}>36 000€<span style={ts(13)}> / an</span></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[
                {label:"Cotisations sociales",value:"7 380€",sub:"20,5% de votre rémunération",color:c.coral},
                {label:"Impôt estimé",value:"6 200€",sub:"Barème progressif belge",color:c.orange},
                {label:"Ce qui vous reste",value:"22 420€",sub:"Soit environ 1 868€/mois net",color:c.teal},
              ].map((b,i) => (
                <div key={i} style={{background:b.color+"10",borderRadius:10,padding:14,borderTop:"3px solid "+b.color}}>
                  <div style={ts(11,{color:b.color,fontWeight:600})}>{b.label}</div>
                  <div style={{fontFamily:"'Quicksand'",fontSize:18,fontWeight:700,color:c.navy,margin:"4px 0"}}>{b.value}</div>
                  <div style={ts(10)}>{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:c.tealL,borderRadius:10,padding:10,borderLeft:"3px solid "+c.teal}}>
            {ann("💡 En Belgique, il est recommandé de se verser au moins 45 000€/an pour bénéficier du taux réduit d'impôt des sociétés (20% au lieu de 25%).",c.teal,13)}
          </div>
        </div>}

        {/* ═══════════════════ RENTABILITÉ MOIS PAR MOIS ═══════════════════ */}
        {page==="monthly"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Ma rentabilité mois par mois</h1>
          <p style={ts(12,{marginBottom:10})}>Est-ce que vous gagnez ou perdez de l'argent chaque mois ?</p>
          <div style={{background:c.tealL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.teal}}>
            <span style={ts(11)}>Les barres <strong style={{color:c.teal}}>vertes</strong> = mois où vous gagnez de l'argent. Les barres <strong style={{color:c.coral}}>rouges</strong> = mois où vous en perdez. C'est normal de perdre les premiers mois — l'important c'est la tendance.</span>
          </div>
          <div style={{background:c.card,borderRadius:14,padding:20,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:16}}>
            <div style={{display:"flex",gap:6,alignItems:"flex-end",height:140,justifyContent:"space-around"}}>
              {[{m:"Jan",v:-2200},{m:"Fév",v:-1800},{m:"Mar",v:-500},{m:"Avr",v:800},{m:"Mai",v:1200},{m:"Jun",v:2400},{m:"Jul",v:1900},{m:"Aoû",v:600},{m:"Sep",v:3100},{m:"Oct",v:3800},{m:"Nov",v:4200},{m:"Déc",v:5400}].map((d,i) => {
                const maxAbs = 5400;
                const h = Math.abs(d.v)/maxAbs*60;
                const isPos = d.v >= 0;
                return (
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                    <div style={ts(9,{fontWeight:600,color:isPos?c.teal:c.coral,marginBottom:2})}>{isPos?"+":""}{fmt(d.v)}</div>
                    <div style={{width:"80%",height:h,background:isPos?c.teal:c.coral,borderRadius:"4px 4px 0 0",opacity:isPos?.7:.5,minHeight:4}}/>
                    <div style={ts(9,{marginTop:4})}>{d.m}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[
              {label:"Premiers mois rentables",value:"Avril",sub:"4ème mois d'activité",color:c.teal},
              {label:"Meilleur mois",value:"+5 400€",sub:"Décembre",color:c.teal},
              {label:"Total année",value:"+18 900€",sub:"Bénéfice cumulé",color:c.navy},
            ].map((b,i) => (
              <div key={i} style={{background:c.card,borderRadius:12,padding:14,border:"1px solid "+c.brd,boxShadow:sh}}>
                <div style={ts(10)}>{b.label}</div>
                <div style={{fontFamily:"'Quicksand'",fontSize:18,fontWeight:700,color:b.color,margin:"4px 0"}}>{b.value}</div>
                <div style={ts(10)}>{b.sub}</div>
              </div>
            ))}
          </div>
        </div>}

        {/* ═══════════════════ TABLEAU DE BORD FISCAL ═══════════════════ */}
        {page==="fiscal"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Mes impôts et taxes</h1>
          <p style={ts(12,{marginBottom:10})}>Tout ce que votre société doit payer à l'État, simplifié.</p>
          <div style={{background:c.orangeL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.orange}}>
            <span style={ts(12,{color:c.orange,fontWeight:600})}>Pourquoi tant de taxes ?</span><br/>
            <span style={ts(11)}>En Belgique, votre société paie 3 grandes catégories : la <strong style={{color:c.navy}}>TVA</strong> (taxe sur vos ventes), l'<strong style={{color:c.navy}}>impôt des sociétés</strong> (sur vos bénéfices) et les <strong style={{color:c.navy}}>cotisations sociales</strong> (pour votre protection sociale). C'est normal — tout le monde les paie.</span>
          </div>
          {[
            {label:"TVA à reverser",desc:"Vous collectez 21% de TVA sur vos ventes, vous récupérez la TVA sur vos achats. Chaque trimestre, vous payez la différence à l'État.",amount:"4 850€",freq:"/ trimestre",color:c.coral,status:"Prochain : 20 avril"},
            {label:"Impôt des sociétés (ISOC)",desc:"25% de votre bénéfice (ou 20% si vous vous versez au moins 45 000€/an de salaire). Payé une fois par an.",amount:"9 550€",freq:"/ an estimé",color:c.orange,status:"Acomptes trimestriels recommandés"},
            {label:"Cotisations sociales dirigeant",desc:"Environ 20,5% de votre rémunération de gérant. Ça finance votre pension, maladie, allocations.",amount:"1 845€",freq:"/ trimestre",color:c.sun,status:"Prochain : 31 mars"},
            {label:"Précompte professionnel",desc:"Si vous avez des employés, vous retenez une partie de leur salaire pour l'impôt et le versez à l'État.",amount:"2 100€",freq:"/ mois",color:c.navy,status:"Pas encore d'employés prévu en An 1"},
          ].map((t,i) => (
            <div key={i} style={{background:c.card,borderRadius:12,padding:16,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div><div style={hs(13)}>{t.label}</div><div style={ts(10,{color:t.color,fontWeight:500})}>{t.status}</div></div>
                <div style={{textAlign:"right"}}><span style={{fontFamily:"'Quicksand'",fontSize:18,fontWeight:700,color:t.color}}>{t.amount}</span><div style={ts(10)}>{t.freq}</div></div>
              </div>
              <div style={ts(11,{color:c.ch})}>{t.desc}</div>
            </div>
          ))}
        </div>}

        {/* ═══════════════════ MES SCÉNARIOS ═══════════════════ */}
        {page==="scenarios"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Mes scénarios</h1>
          <p style={ts(12,{marginBottom:10})}>Et si ça marche mieux — ou moins bien — que prévu ?</p>
          <div style={{background:c.tealL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.teal}}>
            <span style={ts(11)}>Comparer 3 versions de votre avenir vous aide à <strong style={{color:c.navy}}>anticiper les risques</strong> et à montrer aux banques que vous avez réfléchi à tous les cas. Personne ne peut prédire l'avenir — mais on peut s'y préparer.</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
            {[
              {name:"Pessimiste",emoji:"😰",ca:80000,charges:89200,color:c.coral,desc:"Peu de clients, démarrage lent"},
              {name:"Réaliste",emoji:"🎯",ca:127400,charges:89200,color:c.orange,desc:"Hypothèse de base du plan"},
              {name:"Optimiste",emoji:"🚀",ca:180000,charges:95000,color:c.teal,desc:"Forte demande, croissance rapide"},
            ].map((s,i) => {
              const result = s.ca - s.charges;
              return (
                <div key={i} style={{background:c.card,borderRadius:14,padding:18,border:"2px solid "+(i===1?c.orange:c.brd),boxShadow:sh}}>
                  <div style={{textAlign:"center",marginBottom:10}}>
                    <div style={{fontSize:28}}>{s.emoji}</div>
                    <div style={hs(14,{color:s.color})}>{s.name}</div>
                    <div style={ts(10)}>{s.desc}</div>
                  </div>
                  {[
                    {l:"Ventes",v:s.ca,col:c.teal},
                    {l:"Dépenses",v:s.charges,col:c.coral},
                    {l:"Résultat",v:result,col:result>=0?c.teal:c.coral},
                  ].map((r,ri) => (
                    <div key={ri} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:ri===2?"2px solid "+c.brd:"1px solid "+c.brd+"40"}}>
                      <span style={ts(11,{fontWeight:ri===2?600:400})}>{r.l}</span>
                      <span style={{fontFamily:"'Quicksand'",fontSize:ri===2?15:13,fontWeight:ri===2?700:500,color:r.col}}>{ri===2&&result>=0?"+":ri===2&&result<0?"−":""}{fmt(Math.abs(r.v))}€</span>
                    </div>
                  ))}
                  {result < 0 && <div style={{marginTop:8,background:c.coralL,borderRadius:8,padding:8}}>
                    {ann("⚠ Dans ce scénario, il faudrait "+fmt(Math.abs(result))+"€ de trésorerie pour tenir.",c.coral,12)}
                  </div>}
                  {result > 0 && i === 2 && <div style={{marginTop:8,background:c.tealL,borderRadius:8,padding:8}}>
                    {ann("→ Vous pourriez embaucher ou investir davantage !",c.teal,12)}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>}

        {/* ═══════════════════ CHECK-UP NOTAIRE ═══════════════════ */}
        {page==="checklist"&&<div>
          <h1 style={hs(22,{marginBottom:4})}>Check-up avant le notaire</h1>
          <p style={ts(12,{marginBottom:10})}>Tout ce qu'il faut préparer avant de constituer votre SRL chez le notaire.</p>
          <div style={{background:c.orangeL,borderRadius:10,padding:"10px 14px",marginBottom:16,borderLeft:"3px solid "+c.orange}}>
            <span style={ts(11)}>Le notaire est <strong style={{color:c.navy}}>obligatoire</strong> pour créer une SRL en Belgique. Il rédige l'acte constitutif et conserve votre plan financier. Cette checklist vous assure de <strong style={{color:c.navy}}>ne rien oublier le jour J</strong>.</span>
          </div>
          {[
            {cat:"Documents obligatoires",items:[
              {label:"Plan financier signé par les fondateurs",done:true},
              {label:"Projet de statuts (rédigé avec le notaire)",done:true},
              {label:"Preuve d'ouverture du compte bancaire bloqué",done:false},
              {label:"Versement de l'apport en capital sur le compte bloqué",done:false},
              {label:"Pièce d'identité de chaque fondateur",done:true},
            ]},
            {cat:"Décisions à prendre",items:[
              {label:"Nom de la société vérifié (disponibilité BCE)",done:true},
              {label:"Siège social choisi (adresse)",done:true},
              {label:"Répartition des parts entre fondateurs",done:true},
              {label:"Nomination du gérant",done:false},
              {label:"Date de début de l'exercice comptable",done:false},
            ]},
            {cat:"Après le notaire",items:[
              {label:"Inscription à la BCE (Banque-Carrefour des Entreprises)",done:false},
              {label:"Activation TVA",done:false},
              {label:"Affiliation caisse d'assurances sociales",done:false},
              {label:"Assurance RC professionnelle",done:false},
              {label:"Déblocage du compte bancaire",done:false},
            ]},
          ].map((section,si) => {
            const doneCount = section.items.filter(i=>i.done).length;
            return (
              <div key={si} style={{background:c.card,borderRadius:14,padding:18,border:"1px solid "+c.brd,boxShadow:sh,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <h3 style={hs(14)}>{section.cat}</h3>
                  <span style={ts(11,{fontWeight:600,color:doneCount===section.items.length?c.teal:c.orange})}>{doneCount}/{section.items.length}</span>
                </div>
                {section.items.map((item,ii) => (
                  <div key={ii} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:ii>0?"1px solid "+c.brd+"30":"none"}}>
                    <div style={{width:22,height:22,borderRadius:6,background:item.done?c.teal:c.bg,border:item.done?"none":"1.5px solid "+c.brd,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {item.done && <span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                    </div>
                    <span style={ts(12,{color:item.done?c.navy:c.st,textDecoration:item.done?"line-through":"none"})}>{item.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>}

        {/* ═══════════════════ SETTINGS ═══════════════════ */}
        {page==="settings"&&<div>
          <h1 style={hs(22,{marginBottom:14})}>Paramètres</h1>
          <div style={{background:c.card,borderRadius:14,padding:20,border:`1px solid ${c.brd}`,boxShadow:sh}}>
            <div style={{display:"grid",gap:14}}>
              {field("Nom de la société","TechVenture SRL")}
              {field("Numéro BCE","0123.456.789")}
              {field("Exercice comptable","01/01/2025 — 31/12/2025")}
            </div>
          </div>
        </div>}

      </div>
    </div>
  );
};

export default App;
