export interface AnalyticsMetric { label:string; value:string; delta:string; trend:"up"|"down"; }
export interface TrafficSource { source:string; value:number; }
export interface PageStat { page:string; views:number; conversions:number; }
export interface AnalyticsSnapshot { metrics:AnalyticsMetric[]; traffic:TrafficSource[]; pages:PageStat[]; devices:TrafficSource[]; searchQueries:{query:string;clicks:number;impressions:number;position:number}[]; }

export interface AnalyticsService { getSnapshot(range:string):Promise<AnalyticsSnapshot>; }

const snapshot:AnalyticsSnapshot={
  metrics:[
    {label:"Users",value:"4,821",delta:"12.4%",trend:"up"},
    {label:"Sessions",value:"6,202",delta:"8.7%",trend:"up"},
    {label:"Page views",value:"12,942",delta:"10.1%",trend:"up"},
    {label:"Conversions",value:"184",delta:"4.2%",trend:"up"}
  ],
  traffic:[{source:"Google Organic",value:42},{source:"Google Ads",value:31},{source:"Direct",value:16},{source:"Social",value:7},{source:"Other",value:4}],
  devices:[{source:"Mobile",value:61},{source:"Desktop",value:34},{source:"Tablet",value:5}],
  pages:[
    {page:"/",views:4892,conversions:51},
    {page:"/services/accident-assistance/",views:2103,conversions:39},
    {page:"/services/tesla-approved-repair-centre/",views:1824,conversions:32},
    {page:"/services/paintless-dent-removal/",views:1202,conversions:21},
    {page:"/contact/",views:926,conversions:41}
  ],
  searchQueries:[
    {query:"car smash repair melbourne",clicks:382,impressions:7030,position:4.2},
    {query:"panel beater chelsea",clicks:271,impressions:4210,position:3.8},
    {query:"tesla repair melbourne",clicks:224,impressions:5128,position:6.1},
    {query:"paintless dent removal melbourne",clicks:173,impressions:3990,position:7.4},
    {query:"accident assistance melbourne",clicks:139,impressions:2810,position:5.9}
  ]
};

export const mockAnalyticsService:AnalyticsService={
  async getSnapshot(){return new Promise((resolve)=>setTimeout(()=>resolve(snapshot),180));}
};
