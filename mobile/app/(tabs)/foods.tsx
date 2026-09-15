import { useState } from "react";
import { Text, View } from "react-native";
import { useApi } from "@/src/hooks";
import { Card, EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
import type { Food } from "@/src/types";

export default function FoodsScreen() {
  const [query, setQuery] = useState("");
  const { data, loading, error, refresh } = useApi<Food[]>(`/api/foods${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  return <Screen><Text style={styles.eyebrow}>FOOD LIBRARY</Text><Text style={styles.title}>Find your food.</Text><Text style={styles.body}>Browse the Nouriva library by food, cuisine, or ingredient.</Text><TextField label="Search foods" placeholder="Food, ingredient, or cuisine" value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={refresh} />
    {loading && <EmptyState title="Loading foods..." body="Finding options from the Nouriva library." />}
    {!!error && <View><Text style={styles.error}>{error}</Text><Text onPress={refresh} style={styles.link}>Try again</Text></View>}
    {!loading && !error && !data?.length && <EmptyState title="No foods found" body="Try a different search term." />}
    {data?.map((food) => <Card key={food.id}><Text style={styles.sectionTitle}>{food.name}</Text><Text style={styles.caption}>{food.cuisine} · {food.servingSize} · {food.category}</Text><Text style={styles.body}>{Math.round(food.calories)} kcal · {food.protein}g protein · {food.carbohydrates}g carbs · {food.fat}g fat · {food.fiber}g fiber</Text><Text style={styles.caption}>{food.tags?.join(" · ")}</Text></Card>)}
  </Screen>;
}
