$(document).ready(function () {
  "use strict";

  $(".details-row").hide();

  $(".details-check").on("change", function () {
    var row = $(this).closest(".car-row");
    var code = row.attr("data-code");
    var details = $('.details-row[data-for="' + code + '"]');
    if ($(this).is(":checked")) {
      details.stop(true, true).slideDown(180);
    } else {
      details.stop(true, true).slideUp(180);
    }
  });

  function getSelectedCars() {
    var selected = [];
    $(".car-select:checked").each(function () {
      var row = $(this).closest(".car-row");
      selected.push({
        code: row.attr("data-code"),
        name: row.attr("data-name"),
        price: parseInt(row.attr("data-price"), 10),
      });
    });
    return selected;
  }

  function updateSelection() {
    var cars = getSelectedCars();
    if (cars.length === 0) {
      $("#selectedCount").text("لم تختر أي سيارة بعد");
      $("#selectedPreview").text("لم يتم اختيار سيارات بعد.");
    } else {
      $("#selectedCount").text("تم اختيار " + cars.length + " سيارة");
      $("#selectedPreview").text(
        cars
          .map(function (car) {
            return car.name + " (" + car.code + ")";
          })
          .join("، "),
      );
    }
  }

  $(".car-select").on("change", updateSelection);

  $("#continueButton").on("click", function () {
    if (getSelectedCars().length === 0) {
      window.alert("يرجى اختيار سيارة واحدة على الأقل قبل المتابعة.");
      return;
    }
    $("#booking").stop(true, true).slideDown(250);
    updateSelection();
    $("html, body").animate(
      { scrollTop: $("#booking").offset().top - 20 },
      350,
    );
  });

  function setError(id, message) {
    $("#" + id).text(message);
  }

  function clearErrors() {
    $(".field-error").text("");
    $("#formMessage").removeClass("success-message error-message").text("");
  }

  function isValidArabicName(name) {
    return /^[\u0621-\u064A\u0671-\u0673\u0675-\u0677\u0679-\u06D3\u06FA-\u06FC\s]+$/.test(
      name,
    );
  }

  function isValidNationalId(value) {
    return (
      /^\d{11}$/.test(value) &&
      parseInt(value.substring(0, 2), 10) >= 1 &&
      parseInt(value.substring(0, 2), 10) <= 14
    );
  }

  function isValidSyrianMobile(value) {
    return /^09[345689]\d{7}$/.test(value);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    var parts = value.split("-");
    var date = new Date(
      Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])),
    );
    if (
      date.getUTCFullYear() !== Number(parts[0]) ||
      date.getUTCMonth() !== Number(parts[1]) - 1 ||
      date.getUTCDate() !== Number(parts[2])
    ) {
      return null;
    }
    return date;
  }

  function formatMoney(amount) {
    return amount.toLocaleString("en-US") + " ل.س";
  }

  $("#bookingForm").on("submit", function (event) {
    event.preventDefault();
    clearErrors();

    var valid = true;
    var name = $.trim($("#fullName").val());
    var nationalId = $.trim($("#nationalId").val());
    var phone = $.trim($("#phone").val());
    var email = $.trim($("#email").val());
    var startValue = $("#startDate").val();
    var endValue = $("#endDate").val();
    var startDate = parseDate(startValue);
    var endDate = parseDate(endValue);
    var cars = getSelectedCars();

    if (name !== "" && !isValidArabicName(name)) {
      setError("nameError", "الاسم يجب أن يتكوّن من أحرف عربية ومسافات فقط.");
      valid = false;
    }
    if (!isValidNationalId(nationalId)) {
      setError(
        "nationalError",
        "أدخل 11 رقماً، ويجب أن تكون أول خانتين بين 01 و14.",
      );
      valid = false;
    }
    if (phone !== "" && !isValidSyrianMobile(phone)) {
      setError("phoneError", "أدخل رقم موبايل سوري صحيحاً مثل 09XXXXXXXX.");
      valid = false;
    }
    if (email !== "" && !isValidEmail(email)) {
      setError("emailError", "صيغة البريد الإلكتروني غير صحيحة.");
      valid = false;
    }
    if (!startDate) {
      setError("startError", "تاريخ البداية إلزامي ويجب أن يكون صحيحاً.");
      valid = false;
    }
    if (!endDate) {
      setError("endError", "تاريخ النهاية إلزامي ويجب أن يكون صحيحاً.");
      valid = false;
    }
    if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
      setError("endError", "يجب أن يكون تاريخ النهاية بعد تاريخ البداية.");
      valid = false;
    }
    if (cars.length === 0) {
      $("#formMessage")
        .addClass("error-message")
        .text("يرجى اختيار سيارة واحدة على الأقل من الجدول.");
      valid = false;
    }
    if (!valid) {
      $("#formMessage")
        .addClass("error-message")
        .text("يرجى تصحيح الحقول المشار إليها ثم إعادة الإرسال.");
      return;
    }

    var days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
    var discountRate = days > 7 ? 0.1 : 0;
    var totalBeforeDiscount = 0;
    var html =
      '<div class="result-dates"><span>من ' +
      startValue +
      "</span><span>إلى " +
      endValue +
      "</span><strong>" +
      days +
      " يوم تأجير</strong></div>";
    html += '<div class="result-list">';
    $.each(cars, function (index, car) {
      var subtotal = car.price * days;
      totalBeforeDiscount += subtotal;
      html +=
        '<div class="result-car"><div><strong>' +
        car.name +
        "</strong><small>" +
        car.code +
        " · " +
        formatMoney(car.price) +
        " يومياً</small></div><div><strong>" +
        formatMoney(subtotal) +
        "</strong><small>" +
        days +
        " يوم</small></div></div>";
    });
    html += "</div>";
    var discount = Math.round(totalBeforeDiscount * discountRate);
    var finalTotal = totalBeforeDiscount - discount;
    html +=
      '<div class="result-totals"><div><span>المجموع قبل الخصم</span><strong>' +
      formatMoney(totalBeforeDiscount) +
      "</strong></div>";
    html +=
      "<div><span>الخصم (" +
      discountRate * 100 +
      "%)" +
      (days > 7 ? " · مدة تتجاوز 7 أيام" : " · لا ينطبق") +
      "</span><strong>− " +
      formatMoney(discount) +
      "</strong></div>";
    html +=
      '<div class="final-total"><span>المبلغ النهائي</span><strong>' +
      formatMoney(finalTotal) +
      "</strong></div></div>";

    $("#resultContent").html(html);
    $("#resultModal").fadeIn(180);
    $("#formMessage")
      .addClass("success-message")
      .text("تم التحقق من البيانات وحساب التكلفة.");
  });

  function closeModal() {
    $("#resultModal").fadeOut(150);
  }
  $("#closeModal, #confirmClose, .modal-backdrop").on("click", closeModal);
  $(document).on("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });
});
