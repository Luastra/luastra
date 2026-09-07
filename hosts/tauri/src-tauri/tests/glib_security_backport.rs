use glib::prelude::ToVariant;

#[test]
fn variant_string_iteration_is_sound_under_optimization() {
    let values = ["zero", "one", "two", "three", "four"];
    let variant = glib::Variant::array_from_iter::<String>(
        values.into_iter().map(|value| value.to_variant()),
    );

    assert_eq!(variant.array_iter_str().unwrap().next(), Some("zero"));
    assert_eq!(variant.array_iter_str().unwrap().nth(2), Some("two"));
    assert_eq!(variant.array_iter_str().unwrap().last(), Some("four"));
    assert_eq!(variant.array_iter_str().unwrap().next_back(), Some("four"));
    assert_eq!(variant.array_iter_str().unwrap().nth_back(1), Some("three"));
}
