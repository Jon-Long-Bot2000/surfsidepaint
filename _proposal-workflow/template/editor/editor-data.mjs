export const demo={};
export const priceTypes={contract:'Total contract price',labor:'Labor cost',materials:'Material cost','labor-materials':'Labor & materials',other:'Other'};
export const priceLabel=item=>item.priceType==='other'?(item.priceLabel||'Other'):priceTypes[item.priceType||'labor-materials']||'Labor & materials';
