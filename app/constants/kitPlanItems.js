export const KIT_CATEGORIES = [{
  id: 'water_food',
  label: 'Water & Food',
  icon: '💧'
}, {
  id: 'health',
  label: 'Health & Safety',
  icon: '🩹'
}, {
  id: 'tools',
  label: 'Tools & Supplies',
  icon: '🔧'
}, {
  id: 'documents',
  label: 'Documents & Money',
  icon: '📄'
}, {
  id: 'comm_power',
  label: 'Communication & Power',
  icon: '🔋'
}, {
  id: 'comfort',
  label: 'Comfort & Special Needs',
  icon: '🛌'
}];
export const KIT_ITEMS = [{
  id: 'water',
  category: 'water_food',
  name: 'Drinking water',
  unit: 'liters',
  scale: 'perPersonPerDay',
  baseQty: 4
}, {
  id: 'food',
  category: 'water_food',
  name: 'Non-perishable food',
  unit: 'meals',
  scale: 'perPersonPerDay',
  baseQty: 3
}, {
  id: 'can_opener',
  category: 'water_food',
  name: 'Manual can opener',
  unit: 'item',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'first_aid',
  category: 'health',
  name: 'First aid kit',
  unit: 'kit',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'medication',
  category: 'health',
  name: 'Prescription medication supply',
  unit: 'person',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'hygiene',
  category: 'health',
  name: 'Hygiene & sanitation items',
  unit: 'kit',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'masks',
  category: 'health',
  name: 'Dust / N95 masks',
  unit: 'item',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'fire_extinguisher',
  category: 'health',
  name: 'Fire extinguisher',
  unit: 'item',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'flashlight',
  category: 'tools',
  name: 'Flashlight',
  unit: 'item',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'batteries',
  category: 'tools',
  name: 'Spare batteries',
  unit: 'pack',
  scale: 'fixed',
  baseQty: 2
}, {
  id: 'radio',
  category: 'tools',
  name: 'Battery or hand-crank radio',
  unit: 'item',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'multitool',
  category: 'tools',
  name: 'Multi-tool / wrench',
  unit: 'item',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'whistle',
  category: 'tools',
  name: 'Whistle to signal for help',
  unit: 'item',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'duct_tape',
  category: 'tools',
  name: 'Duct tape & plastic sheeting',
  unit: 'set',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'garbage_bags',
  category: 'tools',
  name: 'Garbage bags & wipes',
  unit: 'pack',
  scale: 'fixed',
  baseQty: 2
}, {
  id: 'documents',
  category: 'documents',
  name: 'Copies of ID & important documents',
  unit: 'folder',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'cash',
  category: 'documents',
  name: 'Cash in small bills',
  unit: 'envelope',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'maps',
  category: 'documents',
  name: 'Local paper maps',
  unit: 'item',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'power_bank',
  category: 'comm_power',
  name: 'Portable phone charger',
  unit: 'item',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'contact_list',
  category: 'comm_power',
  name: 'Emergency contact list',
  unit: 'copy',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'blanket',
  category: 'comfort',
  name: 'Blanket or sleeping bag',
  unit: 'item',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'clothing',
  category: 'comfort',
  name: 'Change of clothing',
  unit: 'set',
  scale: 'perPerson',
  baseQty: 1
}, {
  id: 'pet_supplies',
  category: 'comfort',
  name: 'Pet food & supplies (if applicable)',
  unit: 'kit',
  scale: 'fixed',
  baseQty: 1
}, {
  id: 'baby_supplies',
  category: 'comfort',
  name: 'Baby supplies (if applicable)',
  unit: 'kit',
  scale: 'fixed',
  baseQty: 1
}];
export function recommendedQty(item, householdSize, daysTarget) {
  if (item.scale === 'perPersonPerDay') return item.baseQty * householdSize * daysTarget;
  if (item.scale === 'perPerson') return item.baseQty * householdSize;
  return item.baseQty;
}
export function computeReadiness(items, haveByItemId, householdSize, daysTarget) {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => {
    const recommended = recommendedQty(item, householdSize, daysTarget);
    const have = haveByItemId[item.id] || 0;
    const pct = recommended > 0 ? Math.min(1, have / recommended) : 1;
    return sum + pct;
  }, 0);
  return Math.round(total / items.length * 100);
}
