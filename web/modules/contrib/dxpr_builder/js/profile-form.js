(function (Drupal) {
  Drupal.behaviors.useAllCheckboxes = {
    attach(context, settings) {
      const checkAllWrappers = context.querySelectorAll(
        ".check-uncheck-all-wrapper",
      );

      checkAllWrappers.forEach((wrapper) => {
        const checkAllBox = wrapper.querySelector(".check-uncheck-all");
        const detailsElement = wrapper.closest("details");
        const checkboxes = detailsElement.querySelectorAll(
          '.js-form-type-checkbox input[type="checkbox"]',
        );

        const handleCheckAll = function () {
          checkboxes.forEach((checkbox) => {
            if (checkbox !== checkAllBox) {
              checkbox.checked = checkAllBox.checked;
            }
          });
        };

        checkAllBox.addEventListener("change", handleCheckAll);

        if (checkAllBox.checked) {
          handleCheckAll();
        }

        checkboxes.forEach((checkbox) => {
          if (checkbox !== checkAllBox) {
            checkbox.addEventListener("change", () => {
              const allChecked = Array.from(checkboxes).every(
                (cb) => cb === checkAllBox || cb.checked,
              );
              checkAllBox.checked = allChecked;
            });
          }
        });
      });
    },
  };
})(Drupal);
