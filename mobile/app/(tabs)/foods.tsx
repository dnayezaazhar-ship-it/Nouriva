import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useApi } from "@/src/hooks";
import { Button, Card, EmptyState, Screen, SelectField, TextField } from "@/src/components";
import { colors, styles } from "@/src/theme";
import type { Food } from "@/src/types";

const categories = ["all", "Pakistani / Desi", "Indian", "Chinese", "Middle Eastern", "Mediterranean", "Western / Continental", "Japanese", "Korean", "Mexican", "Fruits", "Vegetables", "Grains", "Snacks", "Beverages"];
const number = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

export default function FoodsScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [selected, setSelected] = useState<Food | null>(null);
  const { data, loading, error, refresh } = useApi<Food[]>(`/api/foods${query.trim() || category !== "all" || cuisine !== "all" ? `?${new URLSearchParams({ ...(query.trim() ? { q: query.trim() } : {}), ...(category !== "all" ? { category } : {}), ...(cuisine !== "all" ? { cuisine } : {}) }).toString()}` : ""}`);
  const cuisines = useMemo(() => ["all", ...Array.from(new Set((data ?? []).map((food) => food.cuisine))).sort()], [data]);
  const visible = useMemo(() => (data ?? []).filter((food) => category === "all" || food.category === category), [data, category]);
  const clear = () => { setQuery(""); setCategory("all"); setCuisine("all"); };

  return <Screen>
    <Text style={styles.eyebrow}>FOOD LIBRARY</Text>
    <Text style={styles.title}>Find your food.</Text>
    <Text style={styles.body}>Explore global foods with practical, approximate nutrition reference values.</Text>
    <TextField label="Search foods" placeholder="Foods, ingredients, or cuisines..." value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={refresh} />
    <SelectField label="Category" value={category} options={categories.map((value) => ({ value, label: value === "all" ? "All categories" : value }))} onChange={setCategory} />
    <SelectField label="Cuisine" value={cuisine} options={cuisines.map((value) => ({ value, label: value === "all" ? "All cuisines" : value }))} onChange={setCuisine} />
    {(query || category !== "all" || cuisine !== "all") && <Button label="Clear filters" variant="secondary" onPress={clear} />}
    {loading && <EmptyState title="Loading foods..." body="Finding options from the Nouriva library." />}
    {!!error && <View><Text style={styles.error}>{error}</Text><Text onPress={refresh} style={styles.link}>Try again</Text></View>}
    {!loading && !error && !visible.length && <EmptyState title="No foods found" body="Try a different search or clear your filters." />}
    {visible.map((food) => <Card key={food.id}>
      <Text style={styles.chipTextActive}>{food.category}</Text>
      <Text style={styles.sectionTitle}>{food.name}</Text>
      <Text style={styles.caption}>{food.servingSize} · {food.category === "Fruits" ? "fruit" : food.category === "Vegetables" ? "vegetable" : food.category}</Text>
      <Text style={styles.body}>{food.calories} kcal · {number(food.protein)}g protein · {number(food.carbohydrates)}g carbs · {number(food.fat)}g fat · {number(food.fiber)}g fiber</Text>
      <View style={styles.foodActions}><Pressable onPress={() => setSelected(food)}><Text style={styles.link}>View details</Text></Pressable><Link href={{ pathname: "/log", params: { food: food.id } }} style={styles.link}>Log food →</Link></View>
    </Card>)}
    <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}>{selected && <View style={styles.modalOverlay}><Pressable accessibilityRole="button" accessibilityLabel="Close food details" style={styles.modalBackdrop} onPress={() => setSelected(null)} /><View style={styles.detailModal}><Text style={styles.eyebrow}>{selected.category}</Text><Text style={styles.sectionTitle}>{selected.name}</Text><Text style={styles.body}>{selected.cuisine} cuisine · reference serving: {selected.servingSize}</Text>{[["Calories", `${selected.calories} kcal`], ["Protein", `${number(selected.protein)} g`], ["Carbohydrates", `${number(selected.carbohydrates)} g`], ["Fat", `${number(selected.fat)} g`], ["Fiber", `${number(selected.fiber)} g`]].map(([label, value]) => <View key={label} style={styles.detailRow}><Text style={styles.caption}>{label}</Text><Text style={styles.strong}>{value}</Text></View>)}<Text style={styles.disclaimer}>Nutrition values are approximate reference data and are not medical-grade measurements.</Text><Button label="Log this food" onPress={() => { setSelected(null); router.push({ pathname: "/log", params: { food: selected.id } }); }} /><Button label="Close" variant="secondary" onPress={() => setSelected(null)} /></View></View>}</Modal>
  </Screen>;
}
