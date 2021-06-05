export default function propsToObject({ j, root, componentName, propName, props }) {
  function buildObject(node, value) {
    const shorthand = node.value.expression && node.value.expression.name === node.name.name;
    const property = j.objectProperty(
      j.identifier(node.name.name),
      node.value.expression ? node.value.expression : node.value,
    );
    property.shorthand = shorthand;
    value.push(property);

    return value;
  }

  const isJSXIdentifier = (node, name) => j.JSXIdentifier.check(node) && node.name === name;
  return root.findJSXElements().forEach((path) => {
    const { openingElement } = path.value;
    const isUnscopedElement = isJSXIdentifier(openingElement.name, componentName);
    const isScopedElement =
      j.JSXMemberExpression.check(openingElement.name) &&
      isJSXIdentifier(openingElement.name.object, 'UI') &&
      isJSXIdentifier(openingElement.name.property, componentName);

    if (!isUnscopedElement && !isScopedElement) return;

    let propValue = [];

    const attributes = path.node.openingElement.attributes;
    attributes.forEach((node, index) => {
      // Only transform whitelisted props
      if (node.type === 'JSXAttribute' && props.includes(node.name.name)) {
        propValue = buildObject(node, propValue);
        delete attributes[index];
      }
    });
    if (propValue.length > 0) {
      attributes.push(
        j.jsxAttribute(
          j.jsxIdentifier(propName),
          j.jsxExpressionContainer(j.objectExpression(propValue)),
        ),
      );
    }
  });
}
