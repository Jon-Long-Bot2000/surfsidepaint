export const demo=@@PUBLIC_DATA@@;
export const priceTypes={contract:'Total contract price',labor:'Labor cost',materials:'Material cost','labor-materials':'Labor & materials',other:'Other'};
export const priceLabel=item=>item.priceType==='other'?(item.priceLabel||'Other'):priceTypes[item.priceType||'labor-materials']||'Labor & materials';
export const money = amount => amount===null?'Price pending':new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(amount);
export function selectedPlan(finishId, additions) {
  const finish = demo.finishes.find(item => item.id === finishId) || demo.finishes[0];
  const extras = demo.additions.filter(item => additions.has(item.id));
  const pending=[finish,...extras].some(item=>item.price===null);
  return {finish,extras,pending,total:pending?null:finish.price+extras.reduce((total,item)=>total+item.price,0)};
}
